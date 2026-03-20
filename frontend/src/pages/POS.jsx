import { useState, useEffect, useMemo } from 'react';
import { listSales, createSale, createPayment, getCurrentCashRegister, openCashRegister, closeCashRegister } from '@/api/sales';
import { listProducts } from '@/api/products';
import { initWompiPayment } from '@/api/payments';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Wallet, Search, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'nueva-venta', label: 'Nueva Venta', icon: ShoppingCart },
  { key: 'ventas-dia', label: 'Ventas del Dia', icon: DollarSign },
  { key: 'caja', label: 'Caja', icon: Wallet },
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
  { value: 'nequi', label: 'Nequi', icon: Wallet },
  { value: 'daviplata', label: 'Daviplata', icon: Wallet },
  { value: 'transferencia', label: 'Transferencia', icon: CreditCard },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
];

export default function POS() {
  const [activeTab, setActiveTab] = useState('nueva-venta');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);

  // Nueva Venta state
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Modals
  const [modal, setModal] = useState(null); // null | 'payment' | 'open-register' | 'close-register'
  const [paymentForm, setPaymentForm] = useState({ method: 'efectivo', amount: '', reference: '' });
  const [registerForm, setRegisterForm] = useState({ opening_amount: '', closing_amount: '', notes: '' });

  // Wompi payment state
  const [wompiLoading, setWompiLoading] = useState(false);
  const [wompiPending, setWompiPending] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');

  // Ventas del Dia - expandable rows
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [productsRes, salesRes, regRes] = await Promise.allSettled([
        listProducts(),
        listSales(),
        getCurrentCashRegister(),
      ]);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data || []);
      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data || []);
      if (regRes.status === 'fulfilled') setRegister(regRes.value.data);
      else setRegister(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // --- Cart logic ---
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity: 1,
      }];
    });
  }

  function updateCartQuantity(productId, delta) {
    setCart(prev =>
      prev
        .map(item =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') return subtotal * (Math.min(val, 100) / 100);
    return Math.min(val, subtotal);
  }, [discountType, discountValue, subtotal]);

  const discountPercentage = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') return Math.min(val, 100);
    return subtotal > 0 ? (Math.min(val, subtotal) / subtotal) * 100 : 0;
  }, [discountType, discountValue, subtotal]);

  const total = subtotal - discountAmount;

  function openPaymentModal() {
    if (cart.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }
    setPaymentForm({ method: 'efectivo', amount: String(total), reference: '' });
    setModal('payment');
  }

  const cashChange = useMemo(() => {
    if (paymentForm.method !== 'efectivo') return 0;
    const paid = parseFloat(paymentForm.amount) || 0;
    return Math.max(0, paid - total);
  }, [paymentForm.method, paymentForm.amount, total]);

  // Map local payment method names to Wompi payment_method_type
  function getWompiMethodType(method) {
    const map = {
      tarjeta: 'CARD',
      nequi: 'NEQUI',
      transferencia: 'BANCOLOMBIA_TRANSFER',
      daviplata: 'DAVIPLATA',
    };
    return map[method] || null;
  }

  function isWompiMethod(method) {
    return ['nequi', 'tarjeta', 'transferencia', 'daviplata'].includes(method);
  }

  async function handleCompleteSale(e) {
    e.preventDefault();
    try {
      const salePayload = {
        items: cart.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price })),
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        notes: saleNotes,
      };
      const saleRes = await createSale(salePayload);
      const saleId = saleRes.data?.id;

      if (!saleId) {
        toast.error('Error al crear la venta');
        return;
      }

      if (isWompiMethod(paymentForm.method)) {
        // Process payment through Wompi gateway
        setWompiLoading(true);
        try {
          const wompiPayload = {
            amount: Math.round(total * 100), // Amount in centavos
            currency: 'COP',
            buyer_email: customerEmail || '',
            payment_method_type: getWompiMethodType(paymentForm.method),
            reference: 'sale-' + saleId,
            installments: paymentForm.method === 'tarjeta' ? 1 : undefined,
          };

          const wompiRes = await initWompiPayment(wompiPayload);
          const data = wompiRes.data;

          if (data?.public_key && data?.signature) {
            // Widget flow - redirect to Wompi checkout
            toast.info('Redirigiendo a pasarela de pago...');
            // The Wompi widget will handle the payment, webhook will confirm it
            setWompiPending(true);
            setCart([]);
            setDiscountValue('');
            setSaleNotes('');
            setCustomerEmail('');
            setModal(null);
            loadData();
          } else if (data?.transaction_id && data?.status === 'APPROVED') {
            // S2S flow - payment approved immediately
            toast.success('Pago aprobado exitosamente');
            setCart([]);
            setDiscountValue('');
            setSaleNotes('');
            setCustomerEmail('');
            setModal(null);
            loadData();
          } else if (data?.status === 'PENDING' || data?.transaction_id) {
            // Payment pending confirmation
            toast.info('Pago pendiente de confirmacion. Se actualizara automaticamente.');
            setWompiPending(true);
            setCart([]);
            setDiscountValue('');
            setSaleNotes('');
            setCustomerEmail('');
            setModal(null);
            loadData();
          } else {
            toast.error('Error al iniciar pago con pasarela');
          }
        } catch {
          toast.error('Error al procesar pago con pasarela');
        } finally {
          setWompiLoading(false);
        }
      } else {
        // Cash payment - process directly
        await createPayment({
          sale_id: saleId,
          method: paymentForm.method,
          amount: parseFloat(paymentForm.amount),
          reference: paymentForm.reference,
        });

        toast.success('Venta completada');
        setCart([]);
        setDiscountValue('');
        setSaleNotes('');
        setCustomerEmail('');
        setModal(null);
        loadData();
      }
    } catch {
      toast.error('Error al procesar la venta');
    }
  }

  async function handleOpenRegister(e) {
    e.preventDefault();
    try {
      await openCashRegister({ opening_amount: parseFloat(registerForm.opening_amount) });
      toast.success('Caja abierta');
      setModal(null);
      loadData();
    } catch {
      toast.error('Error al abrir caja');
    }
  }

  async function handleCloseRegister(e) {
    e.preventDefault();
    try {
      await closeCashRegister({ closing_amount: parseFloat(registerForm.closing_amount), notes: registerForm.notes });
      toast.success('Caja cerrada');
      setModal(null);
      loadData();
    } catch {
      toast.error('Error al cerrar caja');
    }
  }

  // --- Today's sales ---
  const todaySales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (sales || []).filter(s => s.created_at?.slice(0, 10) === today);
  }, [sales]);

  const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${register ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`h-2 w-2 rounded-full ${register ? 'bg-green-500' : 'bg-red-500'}`} />
            Caja {register ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </div>

      {/* Wompi Pending Payment Banner */}
      {wompiPending && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">Pago pendiente de confirmacion</p>
              <p className="text-sm text-yellow-700">Se actualizara automaticamente cuando Wompi confirme el pago.</p>
            </div>
          </div>
          <button
            onClick={() => { setWompiPending(false); loadData(); }}
            className="text-sm text-yellow-700 underline hover:text-yellow-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'nueva-venta' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Grid - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg border p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-lg border p-4 text-left hover:border-primary hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
                    <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(product.price)}</p>
                    {product.stock !== undefined && (
                      <p className={`text-xs mt-0.5 ${product.stock <= 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        Stock: {product.stock}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="font-semibold">Carrito</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carrito vacio</p>
                  <p className="text-xs text-muted-foreground">Selecciona productos para agregar</p>
                </div>
              ) : (
                <div className="divide-y max-h-[400px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product_id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)} c/u</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCartQuantity(item.product_id, -1)}
                            className="p-1 border rounded hover:bg-gray-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product_id, 1)}
                            className="p-1 border rounded hover:bg-gray-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(item.unit_price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Discount */}
              {cart.length > 0 && (
                <div className="p-3 border-t">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Descuento</label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={e => { setDiscountType(e.target.value); setDiscountValue(''); }}
                      className="border rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">$</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : subtotal}
                      placeholder={discountType === 'percentage' ? '0%' : '$0'}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {cart.length > 0 && (
                <div className="px-3 pb-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notas</label>
                  <input
                    type="text"
                    placeholder="Notas opcionales..."
                    value={saleNotes}
                    onChange={e => setSaleNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              )}

              {/* Totals */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento {discountType === 'percentage' ? `(${parseFloat(discountValue) || 0}%)` : ''}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Cobrar Button */}
            {cart.length > 0 && (
              <button
                onClick={openPaymentModal}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <CreditCard className="h-5 w-5" />
                Cobrar {formatCurrency(total)}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ventas-dia' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-2xl font-bold">{todaySales.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total del Dia</p>
                <p className="text-2xl font-bold">{formatCurrency(todayTotal)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><CreditCard className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(todaySales.length > 0 ? todayTotal / todaySales.length : 0)}</p>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Ventas del Dia</h2>
            </div>
            {todaySales.length === 0 ? (
              <p className="p-8 text-muted-foreground text-center">No hay ventas registradas hoy</p>
            ) : (
              <div className="divide-y">
                {todaySales.map(sale => (
                  <div key={sale.id}>
                    <button
                      onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Venta #{sale.id?.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(sale.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.payment_status === 'pagado' || sale.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sale.payment_status === 'pagado' || sale.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                        <p className="font-semibold">{formatCurrency(sale.total)}</p>
                        <svg
                          className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSale === sale.id ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedSale === sale.id && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        {/* Items */}
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Productos</p>
                          <div className="bg-white rounded-lg border divide-y">
                            {(sale.items || []).map((item, idx) => (
                              <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                                <span>{item.product_name || item.name || `Producto`} x{item.quantity}</span>
                                <span className="font-medium">{formatCurrency((item.unit_price || 0) * (item.quantity || 0))}</span>
                              </div>
                            ))}
                            {(!sale.items || sale.items.length === 0) && (
                              <p className="px-3 py-2 text-sm text-muted-foreground">Sin detalle de items</p>
                            )}
                          </div>
                        </div>

                        {/* Sale summary */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white rounded-lg border px-3 py-2">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="ml-2 font-medium">{formatCurrency(sale.subtotal || 0)}</span>
                          </div>
                          <div className="bg-white rounded-lg border px-3 py-2">
                            <span className="text-muted-foreground">Descuento:</span>
                            <span className="ml-2 font-medium text-red-600">-{formatCurrency(sale.discount_amount || 0)}</span>
                          </div>
                        </div>

                        {/* Payments */}
                        {sale.payments && sale.payments.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pagos</p>
                            <div className="bg-white rounded-lg border divide-y">
                              {sale.payments.map((payment, idx) => (
                                <div key={idx} className="px-3 py-2 flex justify-between text-sm">
                                  <span className="capitalize">{payment.method}</span>
                                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sale.notes && (
                          <div className="mt-3 text-sm">
                            <span className="text-muted-foreground">Notas:</span>
                            <span className="ml-2">{sale.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'caja' && (
        <div className="space-y-6">
          {/* Register Status */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Estado de la Caja</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${register ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`h-2 w-2 rounded-full ${register ? 'bg-green-500' : 'bg-red-500'}`} />
                {register ? 'Abierta' : 'Cerrada'}
              </span>
            </div>

            {register ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Monto de Apertura</p>
                    <p className="text-xl font-bold">{formatCurrency(register.opening_amount || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Hora de Apertura</p>
                    <p className="text-xl font-bold">{formatDateTime(register.opened_at || register.created_at)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Ventas en Caja</p>
                    <p className="text-xl font-bold">{formatCurrency(todayTotal)}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setModal('close-register'); setRegisterForm({ closing_amount: '', notes: '' }); }}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  Cerrar Caja
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">La caja esta cerrada. Abre la caja para comenzar a registrar ventas.</p>
                <button
                  onClick={() => { setModal('open-register'); setRegisterForm({ opening_amount: '' }); }}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  Abrir Caja
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {modal === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Cobrar Venta</h3>
            <p className="text-2xl font-bold text-primary mb-6">{formatCurrency(total)}</p>

            <form onSubmit={handleCompleteSale} className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Metodo de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, method: pm.value })}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          paymentForm.method === pm.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">Monto Recibido</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-lg font-semibold"
                  required
                />
              </div>

              {/* Change for cash */}
              {paymentForm.method === 'efectivo' && (parseFloat(paymentForm.amount) || 0) >= total && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Cambio</span>
                  <span className="text-lg font-bold text-green-700">{formatCurrency(cashChange)}</span>
                </div>
              )}

              {/* Email for Wompi payment methods */}
              {isWompiMethod(paymentForm.method) && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email del comprador</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {/* Wompi method info banner */}
              {isWompiMethod(paymentForm.method) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  El pago sera procesado a traves de la pasarela Wompi ({paymentForm.method === 'tarjeta' ? 'Tarjeta' : paymentForm.method === 'nequi' ? 'Nequi' : paymentForm.method === 'transferencia' ? 'Transferencia Bancolombia' : 'Daviplata'}).
                </div>
              )}

              {/* Reference for non-cash non-wompi */}
              {paymentForm.method !== 'efectivo' && !isWompiMethod(paymentForm.method) && (
                <div>
                  <label className="block text-sm font-medium mb-1">Referencia</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Numero de referencia..."
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 border rounded-lg py-2.5 font-medium hover:bg-gray-50"
                  disabled={wompiLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={wompiLoading}
                  className="flex-1 bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  {wompiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : isWompiMethod(paymentForm.method) ? (
                    'Pagar con Wompi'
                  ) : (
                    'Confirmar Pago'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Register Modal */}
      {modal === 'open-register' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Abrir Caja</h3>
            <form onSubmit={handleOpenRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto Inicial</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={registerForm.opening_amount}
                  onChange={e => setRegisterForm({ ...registerForm, opening_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2 font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700">Abrir Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {modal === 'close-register' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Cerrar Caja</h3>
            <form onSubmit={handleCloseRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto de Cierre</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={registerForm.closing_amount}
                  onChange={e => setRegisterForm({ ...registerForm, closing_amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={registerForm.notes}
                  onChange={e => setRegisterForm({ ...registerForm, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Observaciones del cierre..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2 font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 text-white rounded-lg py-2 font-medium hover:bg-red-700">Cerrar Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
