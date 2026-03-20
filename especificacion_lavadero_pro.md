# LavaderoPro — Especificación Funcional Completa
**Sistema de Gestión Integral para Lavaderos de Carros y Motos**

> Versión 1.0 | Documento de Especificación Funcional  
> Adaptado al contexto operativo colombiano  
> Cubre operación desde lavaderos pequeños (1 empleado) hasta cadenas multi-sede

---

## Tabla de Contenidos

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Principios de Diseño](#2-principios-de-diseño)
3. [Módulo 1 — Gestión del Lavadero](#3-módulo-1--gestión-del-lavadero)
4. [Módulo 2 — Punto de Venta y Tienda](#4-módulo-2--punto-de-venta-y-tienda)
5. [Módulo 3 — Gestión de Personal](#5-módulo-3--gestión-de-personal)
6. [Módulo 4 — Finanzas y Contabilidad](#6-módulo-4--finanzas-y-contabilidad)
7. [Módulo 5 — Inventario e Insumos](#7-módulo-5--inventario-e-insumos)
8. [Módulo 6 — Clientes y Fidelización](#8-módulo-6--clientes-y-fidelización)
9. [Módulo 7 — Reportes y Dashboard](#9-módulo-7--reportes-y-dashboard)
10. [Módulo 8 — Configuración y Sistema](#10-módulo-8--configuración-y-sistema)
11. [Roles y Permisos](#11-roles-y-permisos)
12. [Flujos de Operación Principal](#12-flujos-de-operación-principal)
13. [Consideraciones Técnicas](#13-consideraciones-técnicas)
14. [Glosario](#14-glosario)

---

## 1. Visión General del Sistema

### 1.1 Descripción

LavaderoPro es un sistema de gestión integral diseñado específicamente para lavaderos de carros y motos en Colombia. El sistema cubre la operación completa del negocio: desde el momento en que un vehículo ingresa al lavadero hasta el cierre de caja, el pago de nómina y el análisis financiero mensual.

El sistema está diseñado bajo el principio de **adaptabilidad total**: cada lavadero puede configurar sus propios servicios, tarifas, categorías de vehículos, métodos de pago y estructura de personal, sin necesidad de modificar el código.

### 1.2 Tipos de Lavadero que Cubre

| Tipo | Descripción | Volumen estimado/día | Características clave |
|------|-------------|----------------------|-----------------------|
| **Pequeño** | 1-2 empleados, barrio residencial | 10 – 25 vehículos | Simplicidad, rapidez de registro, control básico |
| **Mediano** | 3-6 empleados, zona comercial | 25 – 60 vehículos | Turnos, asignación de empleados, tienda integrada |
| **Grande / Detailing** | 6+ empleados, servicios premium | 60 – 120 vehículos | Fotografía, tiempos, reportes avanzados, fidelización |
| **Multi-sede** | Varias sedes o franquicia | Variable por sede | Administración centralizada, reportes consolidados |

### 1.3 Módulos del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    LAVADEROPRO                               │
├─────────────────┬───────────────────────────────────────────┤
│  OPERACIÓN      │  M1: Gestión del Lavadero                 │
│  DIARIA         │  M2: Punto de Venta / Tienda              │
│                 │  M3: Gestión de Personal                   │
├─────────────────┼───────────────────────────────────────────┤
│  GESTIÓN        │  M4: Finanzas y Contabilidad              │
│  DEL NEGOCIO    │  M5: Inventario e Insumos                 │
│                 │  M6: Clientes y Fidelización               │
├─────────────────┼───────────────────────────────────────────┤
│  INTELIGENCIA   │  M7: Reportes y Dashboard                 │
│  Y CONTROL      │  M8: Configuración y Sistema              │
└─────────────────┴───────────────────────────────────────────┘
```

### 1.4 Usuarios del Sistema

- **Propietario / Administrador**: Acceso total. Ve finanzas, reportes, configuración.
- **Administrador de turno**: Gestiona operación del día, caja, personal.
- **Cajero / Recepcionista**: Registra vehículos, cobra servicios, maneja tienda.
- **Lavador**: Ve sus turnos asignados, actualiza estados, ve sus métricas.
- **Contador externo** *(solo lectura)*: Accede a reportes financieros para declaración.

---

## 2. Principios de Diseño

### 2.1 Dinamismo Total

Ningún servicio, tarifa, categoría de vehículo ni proceso está fijo en el sistema. Todo es configurable desde la interfaz de administración sin conocimientos técnicos.

### 2.2 Velocidad Operativa

La interfaz operativa (registro de vehículos, cobro, cambio de estado) debe permitir completar cualquier acción frecuente en menos de 30 segundos. Las pantallas operativas priorizan acción sobre información.

### 2.3 Operación sin Conexión (Offline First)

Las funciones críticas del día a día (registro de vehículos, cobro, cambio de estado de turnos) deben funcionar sin conexión a Internet. La sincronización con el servidor ocurre cuando se restaura la conexión.

### 2.4 Adaptabilidad Regional

El sistema maneja la realidad colombiana: pesos colombianos (COP), SMLV, prestaciones sociales, DIAN, métodos de pago locales (Nequi, Daviplata, transferencia PSE), y la estructura tributaria del país.

### 2.5 Diseño Multi-dispositivo

- **Tablet / PC en mostrador**: Pantalla operativa principal (registro, caja, tablero).
- **Celular del lavador**: Vista de turnos asignados, actualización de estado.
- **TV / Monitor secundario**: Pantalla de llamado para clientes.
- **PC del administrador**: Reportes, finanzas, configuración.

---

## 3. Módulo 1 — Gestión del Lavadero

> **Propósito**: Controlar en tiempo real cada vehículo que ingresa al lavadero, desde la recepción hasta la entrega. Es el corazón operativo del sistema.

---

### 3.1 Recepción de Vehículos

#### 3.1.1 Descripción

Pantalla de registro rápido donde el recepcionista o cajero ingresa la información del vehículo al momento de llegada. Debe completarse en menos de 30 segundos para no generar filas.

#### 3.1.2 Datos del Registro

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| Placa | Texto | Sí | Formato colombiano (ABC-123 o ABC12D). Busca cliente existente automáticamente |
| Tipo de vehículo | Selector | Sí | Moto, Carro, Camioneta, Van, Taxi, Bus, Campero — configurable |
| Tamaño / subtipo | Selector | Condicional | Según tipo: pequeño / mediano / grande / doble cabina / etc. |
| Servicio(s) | Multi-selector | Sí | Uno o varios servicios del catálogo configurado |
| Cliente | Texto / búsqueda | No | Nombre o teléfono. Si es placa conocida, se autocompleta |
| Lavador asignado | Selector | No | Empleado que realizará el lavado. Puede asignarse después |
| Observaciones | Texto libre | No | Rayones, accesorios, instrucciones especiales del cliente |
| Fotos de entrada | Cámara | No | Máximo 5 fotos del estado del vehículo al ingreso |
| Turno prioritario | Checkbox | No | Marca el turno como urgente (mueve al inicio de la cola) |

#### 3.1.3 Comportamiento del Sistema al Registrar

1. Al ingresar la placa, el sistema busca si existe un cliente asociado y precarga su nombre, teléfono y preferencias de servicio anteriores.
2. Al seleccionar tipo de vehículo y servicios, el sistema calcula automáticamente el precio total y el tiempo estimado de duración.
3. Al confirmar el registro, se genera un turno con número consecutivo del día (ej: T-001, T-002...) y el vehículo aparece en el Tablero de Turnos con estado **En espera**.
4. Si hay integración con WhatsApp, se puede enviar un mensaje automático al cliente confirmando el registro y el tiempo estimado.
5. Se puede imprimir o enviar digitalmente un tiquete de recepción con el número de turno.

#### 3.1.4 Tiquete de Recepción

El tiquete generado contiene:
- Nombre del lavadero, logo y datos de contacto
- Número de turno del día
- Placa y tipo de vehículo
- Servicio(s) solicitado(s)
- Precio total a pagar
- Tiempo estimado de entrega
- Fecha y hora de ingreso
- Observaciones especiales
- Código QR para que el cliente consulte el estado de su turno en tiempo real

---

### 3.2 Tablero de Turnos (Kanban Operativo)

#### 3.2.1 Descripción

Vista principal de la operación del día. Muestra todos los vehículos activos organizados por estado, en formato de tablero visual tipo Kanban. Es la pantalla que siempre debe estar visible en el mostrador.

#### 3.2.2 Columnas del Tablero

| Columna | Estado | Color | Descripción |
|---------|--------|-------|-------------|
| **En espera** | WAITING | Gris | Vehículo registrado, aún no ha comenzado el lavado |
| **En proceso** | IN_PROGRESS | Azul | Lavado en curso, con cronómetro activo |
| **Terminado** | DONE | Verde | Lavado completado, pendiente de entrega y cobro |
| **Entregado** | DELIVERED | Verde oscuro | Vehículo entregado y cobrado — se archiva automáticamente |
| **En pausa** | PAUSED | Amarillo | Lavado pausado (problema, cliente regresó, etc.) |
| **Cancelado** | CANCELLED | Rojo | Turno cancelado con motivo registrado |

#### 3.2.3 Tarjeta de Turno

Cada vehículo se representa como una tarjeta que muestra:
- Número de turno (T-001)
- Placa y tipo de vehículo (ícono visual)
- Nombre del cliente (si está registrado)
- Servicio(s) en curso
- Tiempo transcurrido / tiempo estimado restante
- Empleado asignado
- Indicador de prioridad (si aplica)
- Indicador de alerta (si supera el tiempo estimado)

#### 3.2.4 Acciones desde el Tablero

- **Mover de estado**: Drag-and-drop entre columnas o botón de acción rápida
- **Asignar / reasignar lavador**: Desde la tarjeta directamente
- **Ver detalles**: Abre el detalle completo del turno
- **Cobrar**: Acceso directo al módulo de pago desde el estado "Terminado"
- **Agregar servicio**: Añadir servicios adicionales durante el proceso
- **Tomar fotos de salida**: Registro fotográfico del resultado
- **Cancelar turno**: Con campo de motivo obligatorio
- **Imprimir**: Genera comprobante de servicio

#### 3.2.5 Indicadores de Alerta

- **Amarillo**: El turno supera en un 20% el tiempo estimado
- **Naranja**: El turno supera en un 50% el tiempo estimado
- **Rojo**: El turno supera en el 100% el tiempo estimado (doble del tiempo normal)
- Los turnos en alerta suenan una notificación visual en pantalla (sin sonido para no molestar clientes)

---

### 3.3 Catálogo de Servicios

#### 3.3.1 Descripción

Módulo de configuración donde el administrador define todos los servicios que ofrece el lavadero. Es completamente dinámico: se pueden crear, editar, activar, desactivar y eliminar servicios sin afectar el historial.

#### 3.3.2 Estructura de un Servicio

| Campo | Descripción |
|-------|-------------|
| Nombre | Ej: "Lavado exterior completo", "Detailing básico" |
| Descripción | Qué incluye el servicio (se muestra al cliente) |
| Categoría | Agrupar servicios: Básico / Premium / Detailing / Especializado |
| Estado | Activo / Inactivo / Solo con cita previa |
| Tiempo estimado | Duración en minutos — puede variar por tipo de vehículo |
| Imagen | Foto o ícono representativo del servicio |

#### 3.3.3 Tarifas por Tipo de Vehículo

Cada servicio puede tener precios diferentes según el tipo y tamaño del vehículo:

```
Servicio: Lavado Exterior Completo
├── Moto                   → $12.000
├── Carro pequeño          → $18.000
├── Carro mediano          → $20.000
├── Camioneta / SUV        → $25.000
├── Van / Buseta           → $35.000
└── Bus / Camión           → $50.000
```

- Los precios son editables por el administrador en cualquier momento
- El cambio de precio no afecta turnos ya registrados
- Se puede ver el historial de cambios de precio

#### 3.3.4 Ejemplos de Servicios Configurables

**Servicios básicos:**
- Lavado exterior básico
- Lavado exterior completo (incluye llantas y vidrios)
- Lavado interior (aspirado + limpieza tablero)
- Lavado completo (exterior + interior)
- Lavado de motor

**Servicios especializados:**
- Detailing básico
- Detailing completo (corrección de pintura)
- Lavado de tapicería (tela / cuero)
- Polichada con máquina
- Ceramizado
- Desengrasado de chasis
- Restauración de faros
- Desinfección con ozono
- Perfumado y aromatizado

**Servicios adicionales (add-ons):**
- Silicona de tablero
- Brillado de llantas
- Limpieza de vidrios interior
- Desmanchado puntual

#### 3.3.5 Combos y Paquetes

El administrador puede crear paquetes que combinen varios servicios con un precio especial:

```
Paquete "Full Lujo"
├── Incluye: Lavado completo + Polichada + Perfumado
├── Precio individual:  $80.000
├── Precio paquete:     $65.000  (ahorro del 19%)
└── Aplica para: Carro mediano
```

---

### 3.4 Categorías de Vehículos

#### 3.4.1 Descripción

El administrador define las categorías de vehículos que maneja su lavadero. Cada categoría tiene un nombre, ícono, y puede tener subcategorías con precios diferenciados.

#### 3.4.2 Categorías Predeterminadas (editables)

| Categoría | Subcategorías sugeridas |
|-----------|------------------------|
| **Moto** | Scooter, Deportiva, Doble propósito, ATV |
| **Carro** | Pequeño (< 1.6L), Mediano, Sedán grande |
| **Camioneta / SUV** | Estándar, Grande (doble cabina, 4x4) |
| **Van / Buseta** | Van de pasajeros, Buseta escolar |
| **Taxi / Plataforma** | Taxi tradicional, Uber/InDrive |
| **Bus** | Bus intermunicipal, Bus escolar |
| **Vehículo de carga** | Camión pequeño, Tractocamión |

El administrador puede renombrar, agregar o eliminar categorías según su operación.

---

### 3.5 Asignación de Lavadores

#### 3.5.1 Descripción

Permite asignar uno o varios empleados a un turno de lavado. El sistema registra quién realizó cada servicio para efectos de rendimiento y comisiones.

#### 3.5.2 Modos de Asignación

- **Asignación manual en recepción**: El cajero elige el lavador al registrar el vehículo
- **Asignación manual desde el tablero**: Se asigna después desde la tarjeta del turno
- **Auto-asignación por disponibilidad**: El sistema asigna al lavador con menos turnos activos en ese momento
- **Auto-asignación por especialidad**: Ciertos empleados solo reciben ciertos servicios (ej: solo el técnico de detailing recibe servicios de detailing)

#### 3.5.3 Vista del Lavador

Cada empleado tiene acceso a una vista simplificada (desde celular) que muestra:
- Sus turnos asignados en orden de prioridad
- El estado actual de cada turno
- Botones para cambiar el estado (Iniciar / Pausar / Terminar)
- Las instrucciones especiales de cada vehículo
- Su contador de vehículos del día

---

### 3.6 Cronómetro y Tiempos Estimados

#### 3.6.1 Descripción

Cada turno tiene un cronómetro que mide el tiempo real transcurrido frente al tiempo estimado configurado para ese servicio.

#### 3.6.2 Funcionamiento

- El cronómetro arranca automáticamente cuando el turno pasa a estado **En proceso**
- El tiempo estimado se calcula sumando los tiempos configurados de cada servicio seleccionado
- Si hay varios lavadores, el tiempo estimado puede reducirse proporcionalmente
- El sistema registra el tiempo real de cada turno para ajustar los estimados a lo largo del tiempo (aprendizaje histórico)

#### 3.6.3 Estadísticas de Tiempo

El sistema acumula tiempos reales para calcular:
- Tiempo promedio real por servicio (vs. estimado)
- Tiempo promedio real por empleado
- Horas pico donde los tiempos se extienden
- Eficiencia diaria del lavadero

---

### 3.7 Registro Fotográfico

#### 3.7.1 Descripción

Permite tomar fotos del vehículo al ingreso y a la salida. Sirve como evidencia legal ante reclamaciones de daños, y como material de marketing (antes/después).

#### 3.7.2 Funcionamiento

**Fotos de entrada:**
- Hasta 5 fotos desde la cámara del dispositivo
- Se etiquetan automáticamente con fecha, hora y número de turno
- El sistema sugiere ángulos: frontal, trasero, lateral izquierdo, lateral derecho, interior

**Fotos de salida:**
- Misma cantidad y ángulos que las de entrada
- Se pueden comparar lado a lado con las fotos de entrada
- El cliente puede ver las fotos desde el link de su turno

**Gestión de fotos:**
- Las fotos se almacenan asociadas al historial del vehículo (placa)
- El cliente puede solicitar que sus fotos sean eliminadas
- Retención configurable: por defecto 90 días, ajustable por el administrador

---

### 3.8 Pantalla de Llamado (Display TV)

#### 3.8.1 Descripción

Vista diseñada para proyectarse en una TV o monitor en la sala de espera del lavadero. Muestra en tiempo real qué vehículos están listos para ser recogidos, sin necesidad de que el personal llame manualmente a cada cliente.

#### 3.8.2 Información Mostrada

- **Turno listo**: Número de turno, últimas 3 letras/números de la placa
- **En proceso**: Turnos actualmente en lavado con barra de progreso
- **En espera**: Turnos en cola, en orden de llegada
- Hora actual y nombre del lavadero
- Mensaje personalizable (ej: "¡Gracias por visitarnos! Recuerde no dejar objetos de valor en su vehículo")

#### 3.8.3 Acceso

La pantalla de llamado es una URL especial del sistema que se abre en el navegador de la TV. No requiere login. Se actualiza automáticamente en tiempo real.

---

## 4. Módulo 2 — Punto de Venta y Tienda

> **Propósito**: Gestionar las ventas de la tienda integrada al lavadero (productos y servicios adicionales), el cobro de los servicios de lavado, y el control de caja.

---

### 4.1 Caja / POS (Point of Sale)

#### 4.1.1 Descripción

Interfaz de cobro rápida y táctil diseñada para ser usada en mostrador. Permite cobrar servicios de lavado, productos de la tienda, o una combinación de ambos en una sola transacción.

#### 4.1.2 Flujo de Cobro de un Turno de Lavado

1. El turno aparece en estado **Terminado** en el tablero
2. El cajero hace clic en "Cobrar" desde la tarjeta del turno
3. El sistema muestra el resumen: servicios, precio base, descuentos aplicados, total
4. El cajero selecciona el método de pago
5. Si el cliente desea agregar productos de la tienda, se agregan en la misma pantalla
6. Se confirma el pago → el turno pasa a **Entregado**
7. Se genera el recibo y se imprime o envía digitalmente

#### 4.1.3 Flujo de Venta Directa (Tienda sin Lavado)

1. El cajero abre una venta nueva desde el POS
2. Busca productos por nombre, código de barras o categoría
3. Agrega al carrito
4. Selecciona método de pago y confirma
5. Se genera recibo

#### 4.1.4 Venta Combinada

Una misma transacción puede incluir:
- Servicio(s) de lavado (asociados a un turno)
- Productos de la tienda
- Servicios adicionales no asociados a un turno (ej: venta de ambientador sin lavado)

---

### 4.2 Métodos de Pago

#### 4.2.1 Métodos Soportados

| Método | Descripción | Requiere configuración |
|--------|-------------|----------------------|
| **Efectivo** | Pago en billetes y monedas. El sistema calcula el cambio | No |
| **Nequi** | Transferencia o QR. El cajero confirma manualmente la recepción | Opcional (número de celular) |
| **Daviplata** | Igual que Nequi | Opcional (número de celular) |
| **Transferencia bancaria** | El cajero confirma manualmente | Opcional (datos bancarios) |
| **Tarjeta débito/crédito** | Requiere datafono externo. El cajero confirma manualmente | No |
| **PSE / Link de pago** | Enlace enviado al cliente por WhatsApp | Requiere integración |
| **Fiado / Crédito** | El cliente paga después. Queda registrado como cuenta por cobrar | Sí (aprobar crédito al cliente) |
| **Mixto** | Parte en efectivo, parte Nequi, etc. | No |

#### 4.2.2 Manejo del Efectivo

- Al iniciar el turno de caja, el cajero registra el efectivo de apertura (base de caja)
- Cada pago en efectivo registra el monto recibido y el cambio entregado
- Al cierre de caja, el sistema muestra el efectivo esperado vs. el efectivo contado
- Las diferencias (faltantes o sobrantes) quedan registradas con justificación

---

### 4.3 Productos de la Tienda

#### 4.3.1 Descripción

Catálogo de productos físicos que el lavadero vende: bebidas, snacks, accesorios para vehículo, productos de limpieza, ambientadores, etc.

#### 4.3.2 Ficha de Producto

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del producto |
| Código / referencia | Código interno o código de barras |
| Categoría | Bebidas, Snacks, Accesorios, Lubricantes, etc. |
| Precio de venta | Precio al público en COP |
| Precio de costo | Precio de compra al proveedor |
| Stock actual | Unidades disponibles en inventario |
| Stock mínimo | Nivel de alerta de reabastecimiento |
| IVA | Si aplica o no, y la tarifa (0%, 5%, 19%) |
| Estado | Activo / Inactivo |
| Foto | Imagen del producto |

#### 4.3.3 Gestión del Catálogo

- Creación masiva desde archivo Excel/CSV
- Lectura de código de barras con la cámara del dispositivo
- Categorías configurables por el administrador
- Historial de cambios de precio

---

### 4.4 Descuentos y Promociones

#### 4.4.1 Tipos de Descuento

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Descuento manual** | El cajero aplica un % o valor fijo en el momento del cobro | "10% por cliente frecuente" |
| **Cupón de descuento** | Código que el cliente presenta. Descuento automático | Código PROMO20 → 20% off |
| **Descuento por servicio** | Configurado en el servicio para fechas o días específicos | "Lunes 15% off lavado básico" |
| **Descuento por combo** | Precio especial por paquete de servicios | Ver sección 3.3.5 |
| **Descuento por volumen** | Clientes empresariales con tarifa diferenciada | "Flota Empresa X: $15.000 por lavado" |
| **Primer lavado gratis** | Para nuevos clientes registrados | Una vez por cliente nuevo |

#### 4.4.2 Control de Descuentos

- Los descuentos manuales requieren permiso por rol (el cajero puede pedir autorización al administrador desde la pantalla)
- Todos los descuentos quedan registrados con motivo, monto y quién los autorizó
- Los reportes muestran el valor total descontado por período

---

### 4.5 Facturación

#### 4.5.1 Recibo Simple

Para operaciones del día a día. Incluye:
- Nombre y datos del lavadero (NIT, dirección, teléfono)
- Fecha y hora de la transacción
- Número de recibo consecutivo
- Detalle de servicios y productos
- Subtotal, descuentos, IVA (si aplica) y total
- Método de pago
- Placa del vehículo (si aplica)
- Nombre del cajero
- Mensaje de agradecimiento personalizable

#### 4.5.2 Factura Electrónica (DIAN)

Para clientes que soliciten factura formal:
- Integración con proveedor autorizado DIAN (Siigo, Alegra, Facturama u otro configurable)
- Generación de CUFE (Código Único de Factura Electrónica)
- Envío automático al correo del cliente
- Registro en el sistema para declaración de renta
- Aplica principalmente para clientes empresariales

---

### 4.6 Apertura y Cierre de Caja

#### 4.6.1 Apertura de Caja

El turno de caja comienza con:
- Registro del cajero responsable
- Conteo y registro del efectivo inicial (base de caja)
- Hora de apertura registrada
- Observaciones (ej: "recibí la caja con billetes dañados")

#### 4.6.2 Cierre de Caja

Al final del turno, el sistema muestra:

```
RESUMEN DE CIERRE DE CAJA
════════════════════════════════════════
Cajero:              María González
Turno:               07:00 AM – 06:00 PM

INGRESOS DEL TURNO
────────────────────────────────────────
Servicios de lavado:          $850.000
Ventas de tienda:             $125.000
Otros ingresos:                $30.000
TOTAL INGRESOS:             $1.005.000

DESGLOSE POR MÉTODO DE PAGO
────────────────────────────────────────
Efectivo:                     $620.000
Nequi:                        $280.000
Transferencia:                $105.000

EFECTIVO
────────────────────────────────────────
Base inicial:                 $100.000
Ingresos efectivo:            $620.000
Efectivo esperado:            $720.000
Efectivo contado:             $718.000
Diferencia:                    -$2.000  ⚠

Observaciones: ___________________
════════════════════════════════════════
```

- Las diferencias de caja quedan registradas y van al módulo de finanzas
- El administrador puede revisar el historial de cierres de cualquier fecha
- El efectivo del cierre de caja puede trasladarse automáticamente como egreso "Retiro de efectivo"

---

## 5. Módulo 3 — Gestión de Personal

> **Propósito**: Administrar el equipo humano del lavadero: contratación, horarios, asistencia, nómina y rendimiento. Adaptado a la legislación laboral colombiana.

---

### 5.1 Registro de Empleados

#### 5.1.1 Ficha del Empleado

| Campo | Descripción |
|-------|-------------|
| Nombre completo | Nombre y apellidos |
| Documento | Cédula de ciudadanía / extranjería |
| Teléfono | Celular principal |
| Dirección | Dirección de residencia |
| Fecha de nacimiento | Para calcular edad y EPS |
| Fecha de ingreso | Inicio del contrato |
| Tipo de contrato | Término fijo / Indefinido / Prestación de servicios / Aprendizaje |
| Cargo / Rol | Lavador / Cajero / Auxiliar / Administrador / etc. |
| Salario base | En COP mensuales |
| Periodicidad de pago | Quincenal / Mensual |
| Cuenta bancaria | Banco y número de cuenta para pago de nómina |
| EPS | Entidad de salud |
| AFP | Fondo de pensiones |
| ARL | Riesgo laboral (nivel según actividad) |
| Caja de compensación | ICBF / SENA / Compensación familiar |
| Estado | Activo / En vacaciones / Incapacitado / Retirado |
| Foto | Foto del empleado para identificación |
| Acceso al sistema | Usuario y contraseña para la app |

#### 5.1.2 Documentos del Empleado

El sistema permite adjuntar digitalmente:
- Copia de cédula
- Hoja de vida
- Contrato firmado
- Exámenes médicos de ingreso
- Paz y salvos anteriores

---

### 5.2 Control de Asistencia y Horarios

#### 5.2.1 Marcación de Entrada y Salida

**Métodos de marcación disponibles (configurables):**

| Método | Descripción |
|--------|-------------|
| **PIN en pantalla** | Cada empleado ingresa su PIN de 4 dígitos |
| **Selfie / Foto** | El sistema toma una foto al marcar |
| **Manual por admin** | El administrador marca la entrada/salida |
| **Código QR** | Cada empleado tiene un QR único que escanea |

- El sistema registra la hora exacta de cada marcación
- Las marcaciones tardías o ausencias generan alertas automáticas al administrador
- Se puede configurar un margen de tolerancia (ej: hasta 10 minutos de retraso permitido)

#### 5.2.2 Configuración de Horarios

El administrador configura los turnos del lavadero:

```
Turno Mañana:     07:00 AM – 01:00 PM  (6 horas)
Turno Tarde:      01:00 PM – 07:00 PM  (6 horas)
Turno Completo:   07:00 AM – 06:00 PM  (10 horas + 1 hora almuerzo)
Turno Especial:   Configurable manualmente
```

- Se pueden asignar turnos diferentes por día de la semana a cada empleado
- El sistema calcula automáticamente las horas trabajadas vs. las horas programadas

#### 5.2.3 Tipos de Tiempo Trabajado

El sistema diferencia:
- **Horas ordinarias diurnas**: Lunes-sábado 6 AM – 9 PM
- **Horas ordinarias nocturnas**: 9 PM – 6 AM (recargo del 35%)
- **Horas extra diurnas**: Más allá de 8 horas, días hábiles (recargo del 25%)
- **Horas extra nocturnas**: Horas extra en horario nocturno (recargo del 75%)
- **Dominicales / Festivos**: Trabajo en domingo o festivo (recargo del 75%)
- **Hora extra dominical**: Extra en domingo o festivo (recargo del 100%)

Todos los recargos se calculan automáticamente según la legislación colombiana vigente.

#### 5.2.4 Novedades de Asistencia

| Novedad | Descripción | Impacto en nómina |
|---------|-------------|-------------------|
| Ausencia justificada | Con soporte (médico, personal) | Descuento según caso |
| Ausencia injustificada | Sin soporte | Descuento proporcional |
| Incapacidad médica | EPS expide incapacidad | Pago según días y EPS |
| Calamidad doméstica | Hasta 5 días | Sin descuento |
| Permiso con goce | Autorizado por admin | Sin descuento |
| Permiso sin goce | Autorizado por admin | Descuento proporcional |
| Vacaciones | Ver sección 5.4 | No descuento (ya causado) |

---

### 5.3 Liquidación de Nómina

#### 5.3.1 Descripción

El sistema calcula la nómina de cada empleado para el período correspondiente (quincenal o mensual), incluyendo todos los componentes de la legislación colombiana.

#### 5.3.2 Componentes del Salario

**Devengado (lo que gana el empleado):**
- Salario base (proporcional a días trabajados)
- Horas extra y recargos (calculados automáticamente)
- Auxilio de transporte (si el salario es ≤ 2 SMLMV, configurable automáticamente)
- Comisiones sobre ventas o servicios (si aplica)
- Bonificaciones y bonos (configurables)
- Primas extralegales (si aplica)

**Deducciones (descuentos al empleado):**
- Salud (4% del salario base)
- Pensión (4% del salario base)
- Retención en la fuente (si aplica según ingresos)
- Descuentos por ausencias injustificadas
- Préstamos o anticipos
- Cuotas de cooperativa (si aplica)

**Aportes del empleador (no se descuentan al empleado):**
- Salud (8.5%)
- Pensión (12%)
- ARL (según nivel de riesgo, lavadero: nivel II ~1.044%)
- ICBF (3%)
- SENA (2%)
- Caja de compensación (4%)

#### 5.3.3 Prestaciones Sociales

El sistema calcula y acumula mensualmente:

| Prestación | Base de cálculo | Periodicidad de pago |
|-----------|-----------------|----------------------|
| **Prima de servicios** | 15 días de salario por semestre | Junio y Diciembre |
| **Cesantías** | 1 mes de salario por año | Consignación a fondo antes de Feb 14 |
| **Intereses a las cesantías** | 12% anual sobre cesantías | Enero de cada año |
| **Vacaciones** | 15 días hábiles por año | Al momento de tomar vacaciones |

El sistema muestra el acumulado de cada prestación en tiempo real para que el administrador sepa cuánto debe tener provisionado.

#### 5.3.4 Recibo de Nómina (Colilla de Pago)

Cada período, el sistema genera una colilla de pago por empleado con:
- Período liquidado
- Detalle de días trabajados y novedades
- Desglose de devengado (salario + extras + otros)
- Desglose de deducciones
- Neto a pagar
- Firma digital del empleado (opcional)

La colilla puede imprimirse, enviarse por correo o compartirse por WhatsApp.

#### 5.3.5 SMLMV Actualizable

El valor del SMLMV se actualiza manualmente cada año (enero) desde la configuración. Todos los cálculos que dependen de él se ajustan automáticamente.

---

### 5.4 Vacaciones

#### 5.4.1 Gestión de Vacaciones

- El sistema calcula los días de vacaciones causados por cada empleado en tiempo real
- El administrador puede aprobar o rechazar solicitudes de vacaciones
- Al aprobar, el período queda bloqueado en el calendario del empleado
- El sistema paga los días de vacaciones en la nómina correspondiente

#### 5.4.2 Calendario de Vacaciones

Vista de calendario que muestra:
- Empleados en vacaciones (no disponibles)
- Empleados próximos a salir de vacaciones
- Alerta si varios empleados estarán en vacaciones simultáneamente (impacto operativo)

---

### 5.5 Comisiones y Bonificaciones

#### 5.5.1 Tipos de Comisión

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Por vehículo lavado** | Monto fijo por cada vehículo | $1.500 por vehículo |
| **Por tipo de servicio** | Diferente según el servicio | $3.000 detailing, $1.000 básico |
| **Porcentaje de ventas** | % sobre ventas de tienda | 3% de lo vendido en tienda |
| **Bono por meta** | Si supera X vehículos/semana | Bono de $50.000 si lava 80+ esta semana |
| **Bono de puntualidad** | Si no tiene tardanzas en el mes | Bono mensual $30.000 |

Las comisiones se calculan automáticamente con base en el historial de turnos asignados y se incluyen en la nómina del período.

---

### 5.6 Rendimiento de Empleados

#### 5.6.1 Métricas por Empleado

El sistema calcula para cada empleado:
- Número de vehículos atendidos (día / semana / mes)
- Tiempo promedio de lavado por tipo de servicio
- Calificación promedio de clientes (si el sistema tiene encuesta)
- Tasa de retraso (% de turnos que superaron el tiempo estimado)
- Puntualidad (% de marcaciones a tiempo)
- Ausencias en el período

#### 5.6.2 Ranking del Equipo

Vista comparativa del desempeño del equipo:
- Quién ha lavado más vehículos en el mes
- Quién tiene mejor calificación de clientes
- Quién tiene mejor puntualidad

Visible solo para administradores. Se puede compartir con el equipo de manera opcional (para motivación).

---

## 6. Módulo 4 — Finanzas y Contabilidad

> **Propósito**: Dar visibilidad completa de la salud financiera del negocio: ingresos, egresos, flujo de caja, rentabilidad por servicio y proyecciones.

---

### 6.1 Registro de Ingresos y Egresos

#### 6.1.1 Ingresos

Los ingresos se registran de forma automática al cobrar un turno o una venta de tienda. También se pueden registrar ingresos manuales (ej: arrendamiento de local, otros servicios).

**Categorías de ingreso (configurables):**
- Servicios de lavado
- Venta de productos (tienda)
- Servicios de detailing
- Otros servicios
- Ingresos financieros
- Otros ingresos

#### 6.1.2 Egresos

Los egresos se registran manualmente o de forma automática:

**Registro automático:**
- Pago de nómina (desde el módulo de personal)
- Retiro de efectivo de caja

**Registro manual:**
- Compra de insumos de lavado
- Compra de productos para tienda
- Arrendamiento del local
- Servicios públicos (agua, luz, gas, internet)
- Mantenimiento de equipos
- Publicidad y marketing
- Transporte y gasolina
- Gastos bancarios y comisiones
- Impuestos y gravámenes
- Préstamos y obligaciones financieras
- Otros gastos

#### 6.1.3 Registro de Egreso

Cada egreso incluye:
- Fecha
- Categoría
- Descripción
- Monto
- Método de pago utilizado
- Proveedor / beneficiario
- Comprobante adjunto (foto o PDF de factura)
- Responsable del registro

---

### 6.2 Flujo de Caja

#### 6.2.1 Vista del Flujo de Caja

El sistema muestra el flujo de caja en diferentes períodos:

**Vista diaria:** Ingresos y egresos de hoy, hora a hora.  
**Vista semanal:** Comparativo de ingresos vs. egresos por día.  
**Vista mensual:** Total mensual con evolución día a día.  
**Vista acumulada:** Desde el inicio del año o del negocio.

#### 6.2.2 Saldo Disponible

El sistema calcula y muestra en tiempo real:
- Saldo en efectivo (caja física)
- Saldo en cuentas bancarias (ingresado manualmente o vía integración)
- Saldo total disponible

Se puede configurar una alerta cuando el saldo disponible baje de un mínimo definido por el administrador.

#### 6.2.3 Proyección de Flujo de Caja

El sistema puede proyectar el flujo de caja de las próximas semanas basándose en:
- Promedio histórico de ingresos por día de la semana
- Compromisos de pago fijos (arrendamiento, nómina, etc.) registrados como gastos recurrentes
- Alertas de cuándo el flujo podría volverse negativo

---

### 6.3 Gastos Recurrentes

El administrador puede registrar gastos que se repiten periódicamente (mensual, quincenal, etc.) para que el sistema los incluya en las proyecciones y envíe recordatorios de pago:

```
Gastos recurrentes configurados:
├── Arrendamiento del local     → $1.200.000  (día 5 de cada mes)
├── Internet                    → $85.000     (día 15 de cada mes)
├── Suscripción LavaderoPro     → $120.000    (día 1 de cada mes)
└── Seguro de equipos           → $150.000    (trimestral)
```

---

### 6.4 Rentabilidad por Servicio

#### 6.4.1 Descripción

El sistema calcula cuánto gana realmente el lavadero por cada tipo de servicio, descontando el costo de los insumos utilizados y el costo de la mano de obra.

#### 6.4.2 Cálculo de Rentabilidad

```
RENTABILIDAD — Lavado Exterior Completo (Carro Mediano)
═══════════════════════════════════════════════════════
Precio de venta:                          $20.000

Costo de insumos (por lavado):
  └── Shampoo (50ml × $45/ml):             -$2.250
  └── Cera (20ml × $80/ml):               -$1.600
  └── Silicona (10ml × $30/ml):             -$300
  Subtotal insumos:                        -$4.150

Costo de mano de obra:
  └── Tiempo: 25 min × $4.170/hora:       -$1.738
  Subtotal MO:                             -$1.738

Costo total:                              -$5.888
MARGEN BRUTO:                             $14.112  (70.6%)
═══════════════════════════════════════════════════════
```

El administrador configura el costo por litro/ml de cada insumo y el consumo estimado por servicio. El costo de mano de obra se calcula automáticamente del salario del empleado.

---

### 6.5 Cuentas por Cobrar

#### 6.5.1 Descripción

Manejo de clientes que tienen crédito: clientes empresariales con facturación mensual, clientes de confianza a los que se les fía, o planes de pago.

#### 6.5.2 Funcionalidad

- Lista de clientes con saldo pendiente
- Historial de servicios tomados a crédito
- Registro de abonos y pagos parciales
- Fecha de vencimiento del cobro
- Alertas de cuentas vencidas
- Estado de la cuenta: al día / en mora / vencida

#### 6.5.3 Facturación a Clientes Empresariales

Para flotas de empresas:
- Al final del mes, el sistema genera una factura consolidada con todos los servicios tomados por los vehículos de la empresa
- Se envía por correo electrónico
- Se registra el pago al recibirse

---

### 6.6 Estado de Pérdidas y Ganancias (P&G)

#### 6.6.1 Descripción

Resumen financiero del negocio en un período, adaptado a la realidad de un pequeño negocio colombiano, sin jerga contable compleja.

#### 6.6.2 Estructura del P&G

```
ESTADO FINANCIERO — Marzo 2025
═══════════════════════════════════════════════
INGRESOS TOTALES:                  $4.850.000
  Servicios de lavado:             $3.920.000
  Venta de productos:                $680.000
  Otros ingresos:                    $250.000

COSTOS DIRECTOS:                  -$1.240.000
  Insumos de lavado:                -$480.000
  Costo productos vendidos:         -$340.000
  Comisiones de empleados:         -$420.000

UTILIDAD BRUTA:                    $3.610.000  (74.4%)

GASTOS OPERATIVOS:                -$2.180.000
  Nómina (salarios + prestaciones): -$1.450.000
  Arrendamiento:                    -$400.000
  Servicios públicos:               -$220.000
  Marketing:                         -$60.000
  Otros gastos:                      -$50.000

UTILIDAD OPERATIVA (EBITDA):       $1.430.000  (29.5%)

Depreciación equipos:               -$85.000
Intereses y gastos bancarios:       -$30.000

UTILIDAD NETA:                     $1.315.000  (27.1%)
═══════════════════════════════════════════════
```

---

## 7. Módulo 5 — Inventario e Insumos

> **Propósito**: Controlar el stock de productos de la tienda y los insumos utilizados en los servicios de lavado, asegurando que nunca falte lo necesario para operar.

---

### 7.1 Catálogo de Inventario

#### 7.1.1 Dos Tipos de Artículos

| Tipo | Descripción | Se descuenta cuando... |
|------|-------------|----------------------|
| **Producto de tienda** | Para venta al cliente final | Se registra la venta en el POS |
| **Insumo de lavado** | Materiales internos del lavadero | Se registra el lavado (según consumo configurado) |

Los insumos de lavado nunca se venden directamente en el POS — son de uso interno.

---

### 7.2 Gestión de Insumos de Lavado

#### 7.2.1 Insumos Típicos de un Lavadero

| Insumo | Unidad de medida |
|--------|-----------------|
| Shampoo para carros | Litros |
| Cera líquida | Litros |
| Silicona para tablero | Litros |
| Desengrasante (motor) | Litros |
| Limpiavidrios | Litros |
| Brillador de llantas | Litros |
| Tela de microfibra | Unidades |
| Esponjas de lavado | Unidades |
| Ambientador para vehículo | Unidades |
| Gas ozono (desinfección) | Recargas |
| Producto tapicería | Litros |
| Hidratante de cuero | Litros |

#### 7.2.2 Consumo por Servicio

El administrador configura cuánto de cada insumo se consume en cada servicio:

```
Servicio: Lavado Exterior Completo
├── Shampoo:         50 ml
├── Cera:            20 ml
├── Brillador llantas: 15 ml
└── Microfibra:       1 unidad (o uso compartido)
```

Al registrar un lavado completado, el sistema descuenta automáticamente estos insumos del inventario.

#### 7.2.3 Inventario Físico (Conteo)

Periódicamente (semanal o mensual), el administrador puede hacer un conteo físico del inventario y ajustar las cantidades si hay diferencias. El sistema registra todos los ajustes con fecha y usuario responsable.

---

### 7.3 Alertas de Stock

#### 7.3.1 Niveles de Alerta

Por cada artículo, el administrador configura:
- **Stock mínimo**: Nivel donde se genera una alerta de reabastecimiento
- **Stock de emergencia**: Nivel crítico donde se genera una alerta urgente

```
Shampoo para carros:
  Stock actual:     2.5 litros
  Stock mínimo:     3 litros     ← ALERTA: Reabastecer pronto
  Stock emergencia: 1 litro      ← URGENTE: No alcanzará para mañana
```

#### 7.3.2 Notificaciones de Stock

- Alerta en el dashboard del administrador
- Notificación push al celular del administrador
- (Opcional) Mensaje WhatsApp al administrador

---

### 7.4 Compras a Proveedores

#### 7.4.1 Registro de Compras

Cuando se recibe mercancía de un proveedor, el administrador registra:
- Proveedor
- Fecha de compra
- Artículos recibidos y cantidades
- Precio de compra por unidad
- Total de la factura
- Método de pago utilizado
- Foto de la factura del proveedor

El sistema actualiza automáticamente el inventario sumando los artículos recibidos.

#### 7.4.2 Gestión de Proveedores

Por cada proveedor se guarda:
- Nombre del proveedor o empresa
- NIT
- Nombre del contacto comercial
- Teléfono y correo
- Productos que suministra
- Historial de compras y precios
- Condiciones de pago (contado, crédito 30 días, etc.)

#### 7.4.3 Historial de Precios

El sistema guarda el historial de precio de compra de cada artículo para:
- Detectar incrementos de precio de proveedores
- Comparar precios entre proveedores
- Calcular el costo de oportunidad de inventario

---

### 7.5 Kardex de Inventario

Cada artículo tiene un kardex (registro cronológico) que muestra:

```
KARDEX — Shampoo para carros (litros)
═══════════════════════════════════════════════════════════
Fecha       Concepto                  Entrada  Salida  Saldo
─────────────────────────────────────────────────────────
01/03/25    Compra a Proveedor XYZ    10.0              10.0
02/03/25    Lavados del día (23 lavs)          1.15      8.85
03/03/25    Lavados del día (31 lavs)          1.55      7.30
04/03/25    Ajuste conteo físico       0.2               7.50
05/03/25    Lavados del día (27 lavs)          1.35      6.15
═══════════════════════════════════════════════════════════
```

---

## 8. Módulo 6 — Clientes y Fidelización

> **Propósito**: Conocer a los clientes, mantener su historial, fidelizarlos y gestionar cuentas corporativas.

---

### 8.1 Base de Clientes

#### 8.1.1 Registro de Cliente

El sistema puede identificar a un cliente de múltiples formas:
- **Por placa**: La placa del vehículo es el identificador principal
- **Por teléfono**: Útil cuando un cliente tiene varios vehículos
- **Por nombre**: Búsqueda libre

#### 8.1.2 Ficha del Cliente

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre completo o razón social |
| Documento | CC / NIT (opcional) |
| Teléfono | Celular principal (para WhatsApp) |
| Correo electrónico | Para envío de facturas y notificaciones |
| Tipo | Natural / Empresa / Flota |
| Descuento preferencial | % de descuento permanente para este cliente |
| Estado de crédito | Sin crédito / Con crédito aprobado (monto máximo) |
| Notas | Observaciones del equipo (ej: "Le gusta mucho el olor a limón") |
| Vehículos asociados | Lista de placas asociadas a este cliente |

#### 8.1.3 Historial del Cliente

Al buscar un cliente, el sistema muestra:
- Total de veces que ha visitado el lavadero
- Gasto total histórico
- Gasto promedio por visita
- Último servicio tomado y fecha
- Servicio más solicitado
- Puntos acumulados (si hay programa de fidelización)
- Calificaciones que ha dado
- Saldo pendiente (si tiene crédito)
- Línea de tiempo de todas sus visitas con detalle

---

### 8.2 Programa de Puntos y Fidelización

#### 8.2.1 Configuración del Programa

El administrador configura:
- Cuántos puntos otorga cada servicio (ej: 1 punto por cada $1.000 pagados)
- Puntos por servicios especiales (ej: doble puntos los martes)
- Cómo se canjean los puntos (ej: 100 puntos = $5.000 de descuento)
- Tiempo de vigencia de los puntos (ej: vencen a los 6 meses sin visita)

#### 8.2.2 Tarjeta de Fidelización Digital

Cada cliente tiene una tarjeta digital accesible por:
- Link personal que se envía por WhatsApp
- QR que el cajero escanea al cobrar

La tarjeta muestra los puntos acumulados, el historial de acumulación y canje, y las promociones vigentes para el cliente.

#### 8.2.3 Niveles de Membresía

El administrador puede configurar niveles de cliente:

| Nivel | Condición de acceso | Beneficio |
|-------|---------------------|-----------|
| **Estándar** | Por defecto | Programa de puntos básico |
| **Frecuente** | +10 visitas en 3 meses | Doble puntos, descuento del 5% |
| **VIP** | +30 visitas o gasto > $500K/mes | Triple puntos, descuento del 10%, prioridad en cola |
| **Empresarial** | Cuenta corporativa aprobada | Tarifa especial, facturación mensual, sin cola |

---

### 8.3 Notificaciones y Comunicaciones

#### 8.3.1 Notificaciones Automáticas por WhatsApp

| Disparador | Mensaje automático |
|------------|-------------------|
| Registro del vehículo | "Hola [Nombre], recibimos tu [placa]. Tiempo estimado: [X] min. Turno #[N]" |
| Vehículo listo | "¡Tu [placa] está lista! Puedes recogerla en caja. 🚗" |
| Factura / recibo | Envío del PDF del recibo |
| Recordatorio de lavado | "Han pasado [X] días desde tu último lavado. ¡Te esperamos!" |
| Promoción | Mensaje masivo de promoción especial |
| Cumpleaños | Descuento especial en el mes de cumpleaños |
| Puntos por vencer | "Tienes [N] puntos que vencen el [fecha]. ¡Úsalos pronto!" |

#### 8.3.2 Configuración de Recordatorio de Lavado

El administrador configura cada cuántos días el sistema debe enviar recordatorios según el tipo de cliente:
- Moto: recordatorio cada 15 días
- Taxi/Uber: recordatorio cada 7 días
- Carro particular: recordatorio cada 20 días
- Bus/Camión: recordatorio cada 30 días

Cada cliente puede ajustar su propia frecuencia o desactivar los recordatorios.

---

### 8.4 Calificaciones del Servicio

#### 8.4.1 Encuesta Post-Servicio

Inmediatamente después de cobrar, el sistema puede enviar al cliente un mensaje con un link de calificación rápida:
- Puntuación de 1 a 5 estrellas
- Pregunta específica: "¿Cómo quedó tu vehículo?"
- Campo opcional de comentario
- Pregunta de recomendación: "¿Recomendarías este lavadero?" (NPS)

#### 8.4.2 Gestión de Calificaciones

- El administrador ve todas las calificaciones en tiempo real
- Las calificaciones bajas (1-2 estrellas) generan una alerta inmediata para llamar al cliente
- Se puede responder a los comentarios directamente desde el sistema
- Las calificaciones se asocian al turno, al empleado que realizó el servicio y al tipo de servicio

---

### 8.5 Clientes Empresariales y Flotas

#### 8.5.1 Descripción

Empresas con múltiples vehículos que tienen cuenta en el lavadero: empresas de transporte, empresas con flotillas, taxi-moto, etc.

#### 8.5.2 Funcionalidad

- La empresa tiene un NIT y una cuenta madre
- Se asocian múltiples placas a la empresa
- Cualquier vehículo de la empresa puede llegar y lavarse sin pago inmediato
- Al final del mes, se genera y envía una factura consolidada
- El administrador define un cupo de crédito máximo mensual para la empresa
- Si se supera el cupo, se alerta al administrador y se solicita pago parcial

---

## 9. Módulo 7 — Reportes y Dashboard

> **Propósito**: Convertir los datos de la operación diaria en información útil para tomar mejores decisiones de negocio.

---

### 9.1 Dashboard Principal

#### 9.1.1 Descripción

Pantalla de inicio del sistema. Muestra un resumen del estado actual y las métricas clave del día en un vistazo.

#### 9.1.2 Widgets del Dashboard (configurables)

**Sección "Ahora mismo":**
- Vehículos en proceso (con estado y tiempo)
- Vehículos en espera
- Empleados activos / ausentes
- Alertas de inventario

**Sección "Hoy":**
- Ingresos del día (vs. promedio del mismo día de la semana anterior)
- Número de vehículos atendidos
- Ticket promedio
- Servicio más solicitado hoy

**Sección "Este mes":**
- Ingresos vs. mes anterior (gráfico de barras)
- Meta de ingresos mensuales (si está configurada) y % de cumplimiento
- Top 5 servicios del mes
- Empleado con más vehículos atendidos

**Alertas activas:**
- Insumos con stock bajo
- Cuentas por cobrar vencidas
- Empleados con novedades de nómina pendientes
- Turnos con tiempo de espera excesivo

---

### 9.2 Reportes de Ventas y Operación

#### 9.2.1 Reporte de Ingresos

Filtros disponibles:
- Período: hoy / esta semana / este mes / rango personalizado
- Empleado que registró el cobro
- Método de pago
- Servicio
- Tipo de vehículo

El reporte muestra:
- Total de ingresos en el período
- Desglose por servicio
- Desglose por método de pago
- Desglose por empleado (cajero)
- Gráfico de evolución temporal
- Comparación con período anterior
- Ticket promedio y mediana

#### 9.2.2 Reporte de Vehículos Atendidos

- Total de vehículos por período
- Distribución por tipo de vehículo
- Distribución por servicio solicitado
- Horas del día con mayor demanda (mapa de calor)
- Días de la semana con mayor demanda
- Tiempo promedio de atención por servicio

#### 9.2.3 Reporte de Cierre de Caja

- Historial de cierres de caja
- Diferencias de caja acumuladas
- Cuadre por cajero
- Ingresos vs. egresos de caja por período

---

### 9.3 Reportes de Personal

#### 9.3.1 Reporte de Asistencia

- Empleados con mayor ausentismo
- Horas trabajadas vs. horas programadas por empleado
- Detalle de tardanzas
- Historial de novedades

#### 9.3.2 Reporte de Rendimiento

- Vehículos atendidos por empleado (período)
- Tiempo promedio de lavado por empleado y por servicio
- Calificaciones promedio por empleado
- Ranking del equipo

#### 9.3.3 Reporte de Nómina

- Resumen de nómina del período
- Detalle por empleado (devengado, deducciones, neto)
- Acumulado de prestaciones sociales por empleado
- Proyección de prima semestral y cesantías

---

### 9.4 Reportes de Clientes

- Clientes más frecuentes (por número de visitas)
- Clientes de mayor valor (por gasto total)
- Tasa de retención: clientes que volvieron vs. clientes nuevos
- Nuevos clientes registrados por período
- Clientes inactivos (no han visitado en más de X días)
- Análisis de frecuencia: distribución de días entre visitas

---

### 9.5 Reportes de Inventario

- Consumo de insumos por período
- Artículos con mayor rotación (tienda)
- Artículos con menor rotación (posibles mermas)
- Valor del inventario actual
- Costo de ventas del período (COGS)

---

### 9.6 Exportación de Reportes

Todos los reportes se pueden exportar en:
- **PDF**: Con logo del negocio, listo para imprimir o enviar
- **Excel / CSV**: Para análisis externo o entrega al contador

---

## 10. Módulo 8 — Configuración y Sistema

> **Propósito**: Permitir que cada lavadero adapte el sistema completamente a su realidad sin conocimientos técnicos.

---

### 10.1 Perfil del Negocio

| Campo | Descripción |
|-------|-------------|
| Nombre del negocio | Nombre comercial del lavadero |
| Logo | Imagen que aparece en recibos, pantalla, reportes |
| NIT | Para facturación |
| Régimen tributario | Simplificado / Común / Responsable IVA |
| Dirección | Dirección física del establecimiento |
| Teléfono(s) | Uno o varios números de contacto |
| Correo electrónico | Para comunicaciones |
| Horario de atención | Por día de la semana |
| Ciudad / Municipio | Afecta configuraciones regionales |
| Moneda | COP por defecto (con opción a otras) |
| Zona horaria | Colombia (UTC-5) por defecto |

---

### 10.2 Usuarios y Permisos

#### 10.2.1 Roles del Sistema

El sistema tiene roles predefinidos, pero el administrador puede crear roles personalizados:

| Rol | Descripción |
|-----|-------------|
| **Superadministrador** | Acceso total, incluyendo configuración y datos financieros sensibles |
| **Administrador** | Operación completa excepto algunos ajustes de configuración avanzada |
| **Cajero / Recepcionista** | Registro de vehículos, cobro, tienda. Sin acceso a finanzas detalladas |
| **Lavador** | Solo ve sus turnos asignados y puede actualizar su estado |
| **Contador** | Solo lectura de reportes financieros |

#### 10.2.2 Permisos por Módulo

Matriz de permisos granulares donde el administrador puede activar o desactivar capacidades específicas por rol:

```
Ejemplo — Rol Cajero:
├── Registrar vehículos:              ✅ Sí
├── Cobrar turnos:                    ✅ Sí
├── Aplicar descuentos manuales:      ⚠️ Solo hasta 10% (límite configurado)
├── Cancelar turnos:                  ✅ Sí (con motivo)
├── Ver reportes de ventas:           ✅ Solo del turno actual
├── Ver reportes financieros:         ❌ No
├── Gestionar empleados:              ❌ No
├── Modificar precios:                ❌ No
└── Acceder a configuración:          ❌ No
```

#### 10.2.3 Seguridad

- Contraseña obligatoria con mínimo de seguridad configurable
- Sesiones con tiempo de expiración (ej: se cierra la sesión después de 30 minutos de inactividad)
- Registro de auditoría: cada acción queda registrada con usuario, fecha y hora
- Opción de autenticación en dos pasos para el administrador

---

### 10.3 Configuración de Servicios y Tarifas

(Ver detalle completo en Módulo 1 — Catálogo de Servicios)

Desde esta sección de configuración el administrador puede:
- Crear, editar y desactivar servicios
- Ajustar precios por tipo de vehículo
- Crear combos y paquetes
- Configurar tiempos estimados
- Definir el consumo de insumos por servicio

---

### 10.4 Configuración de Nómina

- Valor del SMLMV vigente (actualizable manualmente cada enero)
- Periodicidad de pago (quincenal / mensual)
- Días de trabajo de la semana (ej: lunes a sábado)
- Horario estándar (inicio y fin de jornada)
- Recargos aplicables (nocturno, dominical, festivo)
- Festivos colombianos (actualizables)

---

### 10.5 Configuración de Notificaciones

- Activar/desactivar cada tipo de notificación
- Plantillas de mensajes WhatsApp (editables por el administrador)
- Número de WhatsApp del negocio para envíos
- Frecuencia de recordatorios de lavado por tipo de vehículo
- Destinatarios de alertas administrativas (stock, diferencias de caja, etc.)

---

### 10.6 Multi-Sede

#### 10.6.1 Descripción

Para lavaderos con más de una sede o franquicias de la misma marca.

#### 10.6.2 Funcionalidad

- Cada sede es una unidad independiente con su propio inventario, empleados y caja
- El administrador central ve reportes consolidados de todas las sedes
- Los clientes pueden ser compartidos entre sedes (sus puntos y historial viajan con ellos)
- Configuración central de servicios y precios, con opción de ajuste por sede
- Transferencia de inventario entre sedes
- Comparativo de rendimiento entre sedes

---

### 10.7 Integraciones

| Integración | Descripción | Estado |
|-------------|-------------|--------|
| **WhatsApp Business API** | Notificaciones automáticas a clientes | Disponible |
| **DIAN (Facturación electrónica)** | Vía Siigo, Alegra u otros habilitados | Disponible |
| **Impresora térmica** | Impresión de tiquetes y recibos en 58mm o 80mm | Disponible |
| **Lector código de barras** | Para venta en tienda | Disponible |
| **Cámara IP / CCTV** | Integración básica para registro fotográfico | En desarrollo |
| **Pasarela de pagos** | Links de pago por PSE, tarjeta | En desarrollo |
| **Google / Facebook Ads** | Reportes de efectividad de publicidad | Planificado |

---

### 10.8 Respaldo y Seguridad de Datos

- **Backup automático diario** en la nube (configurable: horario de backup)
- **Backup manual**: El administrador puede descargar una copia completa en cualquier momento
- **Retención**: Los datos se guardan por mínimo 5 años (período recomendado para declaración tributaria)
- **Exportación completa**: El lavadero puede descargar todos sus datos en cualquier momento (no hay lock-in)
- Los datos de clientes se manejan bajo principios de la Ley 1581 de 2012 (Habeas Data Colombia)

---

## 11. Roles y Permisos

### 11.1 Matriz General de Acceso

| Función | Superadmin | Administrador | Cajero | Lavador | Contador |
|---------|:----------:|:-------------:|:------:|:-------:|:--------:|
| Ver tablero de turnos | ✅ | ✅ | ✅ | ✅ | ❌ |
| Registrar vehículos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cambiar estado de turno | ✅ | ✅ | ✅ | ✅ (propios) | ❌ |
| Cobrar turnos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aplicar descuentos | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Gestionar tienda / POS | ✅ | ✅ | ✅ | ❌ | ❌ |
| Apertura / cierre de caja | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver reportes operativos | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Ver reportes financieros | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gestionar empleados | ✅ | ✅ | ❌ | ❌ | ❌ |
| Liquidar nómina | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar inventario | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar egresos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configuración del negocio | ✅ | ⚠️ Limitado | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver auditoría del sistema | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 12. Flujos de Operación Principal

### 12.1 Flujo Completo de un Vehículo

```
INGRESA EL VEHÍCULO
        │
        ▼
┌────────────────────┐
│  RECEPCIÓN         │  ← Cajero registra placa, servicio, cliente
│  (< 30 seg)        │     Sistema genera turno #T-XXX
└────────┬───────────┘     Opcional: foto de entrada, WhatsApp al cliente
         │
         ▼
┌────────────────────┐
│  EN ESPERA         │  ← Turno visible en tablero (columna gris)
│  (cola de lavado)  │     El cliente puede ver su turno desde su celular
└────────┬───────────┘
         │ Lavador disponible
         ▼
┌────────────────────┐
│  EN PROCESO        │  ← Lavador asignado, cronómetro activo
│  (lavado activo)   │     Sistema alerta si supera tiempo estimado
└────────┬───────────┘     Opcional: foto de salida
         │ Lavador termina
         ▼
┌────────────────────┐
│  TERMINADO         │  ← Aparece en tablero (columna verde)
│  (listo para        │     Pantalla TV muestra turno listo
│   entrega)         │     (Opcional) WhatsApp: "Tu vehículo está listo"
└────────┬───────────┘
         │ Cliente llega a pagar
         ▼
┌────────────────────┐
│  COBRO EN CAJA     │  ← POS muestra resumen del turno
│                    │     Cliente puede agregar productos de tienda
│                    │     Selección de método de pago
│                    │     Generación de recibo
└────────┬───────────┘
         │ Pago confirmado
         ▼
┌────────────────────┐
│  ENTREGADO         │  ← Turno archivado en historial
│  (archivado)       │     Descuento automático de insumos en inventario
└────────────────────┘     Acumulación de puntos al cliente
                           (Opcional) Encuesta de satisfacción
```

### 12.2 Flujo de Cierre del Día

```
CIERRE DEL DÍA
      │
      ├── 1. Verificar que todos los turnos estén en estado ENTREGADO o CANCELADO
      │
      ├── 2. Cierre de caja
      │       ├── Contar efectivo físico
      │       ├── Registrar monto contado
      │       └── Sistema calcula diferencia y genera acta de cierre
      │
      ├── 3. Revisar alertas pendientes
      │       ├── Insumos con stock bajo
      │       ├── Cuentas por cobrar vencidas
      │       └── Novedades de personal
      │
      ├── 4. Revisión del resumen del día
      │       ├── Total vehículos atendidos
      │       ├── Total ingresos
      │       └── Comparativo con el día anterior
      │
      └── 5. Sistema genera backup automático nocturno
```

---

## 13. Consideraciones Técnicas

### 13.1 Arquitectura Recomendada

- **Frontend**: Aplicación web progresiva (PWA) — funciona en navegador de PC, tablet y celular sin instalar nada. Se puede "instalar" en el celular para acceso rápido.
- **Backend**: API REST con autenticación JWT
- **Base de datos**: Relacional (PostgreSQL recomendado)
- **Almacenamiento**: Fotos y documentos en servicio de storage en la nube
- **Sincronización offline**: Service Workers para operación sin Internet en funciones críticas

### 13.2 Dispositivos Compatibles

| Dispositivo | Uso recomendado | Resolución mínima |
|-------------|-----------------|-------------------|
| PC de escritorio | Administración, reportes, configuración | 1280 × 720 |
| Tablet (10"+) | Mostrador (registro, caja, tablero) | 1024 × 768 |
| Celular (Android/iOS) | Lavadores, notificaciones, consulta rápida | 360 × 640 |
| Smart TV / Monitor secundario | Pantalla de llamado | 1920 × 1080 |
| Impresora térmica | Tiquetes y recibos | 58mm o 80mm |

### 13.3 Escalabilidad

El sistema está diseñado para funcionar desde:
- **Mínimo**: 1 usuario activo, 10 vehículos/día, sin tienda
- **Máximo probado**: 10 usuarios concurrentes, 150 vehículos/día, multi-sede

### 13.4 Datos Mínimos para Iniciar

Para que un lavadero quede operativo desde el primer día, solo necesita configurar:
1. Nombre del negocio y logo
2. Al menos 1 tipo de vehículo
3. Al menos 1 servicio con su precio
4. Al menos 1 usuario (el administrador)

Todo lo demás es opcional y se puede agregar gradualmente.

---

## 14. Glosario

| Término | Definición en contexto del sistema |
|---------|-----------------------------------|
| **Turno** | Registro de un vehículo que ingresa al lavadero. Tiene un número, estado y ciclo de vida completo |
| **Tablero** | Vista principal tipo Kanban que muestra todos los turnos activos del día |
| **Servicio** | Tipo de lavado u operación ofrecida (configurable). Ej: Lavado exterior, detailing |
| **Insumo** | Producto usado internamente en los lavados (shampoo, cera, etc.). No se vende al público |
| **Producto** | Artículo de la tienda para venta al cliente final |
| **Combo / Paquete** | Conjunto de servicios con precio especial |
| **SMLMV** | Salario Mínimo Legal Mensual Vigente (Colombia) |
| **POS** | Point of Sale — módulo de caja y cobro |
| **COP** | Peso colombiano |
| **NPS** | Net Promoter Score — métrica de probabilidad de recomendación del cliente |
| **Kardex** | Registro cronológico de entradas y salidas de un artículo de inventario |
| **P&G** | Estado de Pérdidas y Ganancias — resumen financiero del negocio |
| **EBITDA** | Utilidad operativa antes de intereses, impuestos, depreciación y amortización |
| **Cuenta por cobrar** | Valor pendiente de pago por parte de un cliente (crédito, fiado) |
| **Novedad de nómina** | Cualquier evento que modifica el pago normal de un empleado (horas extra, ausencia, etc.) |
| **ARL** | Administradora de Riesgos Laborales |
| **AFP** | Administradora de Fondos de Pensiones |
| **CUFE** | Código Único de Factura Electrónica (DIAN) |
| **Multi-sede** | Configuración donde un sistema administra más de una ubicación física |

---

*Documento elaborado para el proyecto LavaderoPro*  
*Versión 1.0 — Marzo 2025*  
*Este documento es la base para el desarrollo técnico del sistema.*  
*Todos los módulos marcados como "Plus" y "Premium" son opcionales y pueden activarse según el plan contratado.*
