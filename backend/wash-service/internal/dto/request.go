package dto

// --- Client ---
type CreateClientRequest struct {
	Nombre       string  `json:"nombre" binding:"required"`
	NIT          string  `json:"nit"`
	Email        string  `json:"email" binding:"required,email"`
	Telefono     string  `json:"telefono"`
	Direccion    string  `json:"direccion"`
	Ciudad       string  `json:"ciudad"`
	Departamento string  `json:"departamento"`
	LogoURL      string  `json:"logo_url"`
	Moneda       string  `json:"moneda"`
	Impuesto     float64 `json:"impuesto"`
}

type UpdateClientRequest struct {
	Nombre       *string  `json:"nombre"`
	NIT          *string  `json:"nit"`
	Email        *string  `json:"email"`
	Telefono     *string  `json:"telefono"`
	Direccion    *string  `json:"direccion"`
	Ciudad       *string  `json:"ciudad"`
	Departamento *string  `json:"departamento"`
	LogoURL      *string  `json:"logo_url"`
	Moneda       *string  `json:"moneda"`
	Impuesto     *float64 `json:"impuesto"`
	Activo       *bool    `json:"activo"`
}

// --- M1: Vehiculos y Servicios ---
type CreateVehicleCategoryRequest struct {
	Name     string  `json:"name" binding:"required"`
	Icon     string  `json:"icon"`
	ParentID *string `json:"parent_id"`
	Orden    *int    `json:"orden"`
}

type UpdateVehicleCategoryRequest struct {
	Name     *string `json:"name"`
	Icon     *string `json:"icon"`
	ParentID *string `json:"parent_id"`
	Orden    *int    `json:"orden"`
	Activo   *bool   `json:"activo"`
}

type CreateWashServiceRequest struct {
	Name                 string `json:"name" binding:"required"`
	Description          string `json:"description"`
	Category             string `json:"category"`
	EstimatedTimeMinutes *int   `json:"estimated_time_minutes"`
	ImageURL             string `json:"image_url"`
}

type UpdateWashServiceRequest struct {
	Name                 *string `json:"name"`
	Description          *string `json:"description"`
	Category             *string `json:"category"`
	Status               *string `json:"status"`
	EstimatedTimeMinutes *int    `json:"estimated_time_minutes"`
	ImageURL             *string `json:"image_url"`
}

type CreateServicePriceRequest struct {
	WashServiceID     string  `json:"wash_service_id" binding:"required"`
	VehicleCategoryID string  `json:"vehicle_category_id" binding:"required"`
	Price             float64 `json:"price" binding:"required,gt=0"`
	Currency          string  `json:"currency"`
}

type UpdateServicePriceRequest struct {
	Price    *float64 `json:"price"`
	Currency *string  `json:"currency"`
}

// --- M1: Turnos ---
type CreateTurnRequest struct {
	Plate              string   `json:"plate" binding:"required"`
	VehicleCategoryID  string   `json:"vehicle_category_id" binding:"required"`
	CustomerID         *string  `json:"customer_id"`
	AssignedEmployeeID *string  `json:"assigned_employee_id"`
	Services           []string `json:"services"` // wash_service_id list
	Observations       string   `json:"observations"`
	Priority           *int     `json:"priority"`
}

type UpdateTurnStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Reason string `json:"reason"`
}

type AssignTurnRequest struct {
	EmployeeID string `json:"employee_id" binding:"required"`
}

type AddTurnServiceRequest struct {
	WashServiceID string   `json:"wash_service_id" binding:"required"`
	Price         *float64 `json:"price"`
}

// --- M2: POS ---
type CreateProductRequest struct {
	Name      string   `json:"name" binding:"required"`
	Code      string   `json:"code"`
	Barcode   string   `json:"barcode"`
	Category  string   `json:"category"`
	SalePrice float64  `json:"sale_price" binding:"required,gt=0"`
	CostPrice *float64 `json:"cost_price"`
	Stock     *int     `json:"stock"`
	MinStock  *int     `json:"min_stock"`
	IVARate   *float64 `json:"iva_rate"`
	ImageURL  string   `json:"image_url"`
}

type UpdateProductRequest struct {
	Name      *string  `json:"name"`
	Code      *string  `json:"code"`
	Barcode   *string  `json:"barcode"`
	Category  *string  `json:"category"`
	SalePrice *float64 `json:"sale_price"`
	CostPrice *float64 `json:"cost_price"`
	Stock     *int     `json:"stock"`
	MinStock  *int     `json:"min_stock"`
	IVARate   *float64 `json:"iva_rate"`
	Status    *string  `json:"status"`
	ImageURL  *string  `json:"image_url"`
}

type CreateSaleRequest struct {
	TurnID   *string           `json:"turn_id"`
	Items    []SaleItemRequest `json:"items" binding:"required,min=1"`
	Discount *float64          `json:"discount"`
	Notes    string            `json:"notes"`
}

type SaleItemRequest struct {
	ItemType  string  `json:"item_type" binding:"required"` // service, product
	ItemID    string  `json:"item_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,gt=0"`
	UnitPrice float64 `json:"unit_price" binding:"required"`
}

type CreatePaymentRequest struct {
	SaleID    string  `json:"sale_id" binding:"required"`
	Method    string  `json:"method" binding:"required"`
	Amount    float64 `json:"amount" binding:"required,gt=0"`
	Reference string  `json:"reference"`
}

type OpenCashRegisterRequest struct {
	OpeningAmount float64 `json:"opening_amount"`
}

type CloseCashRegisterRequest struct {
	ClosingAmount float64 `json:"closing_amount"`
	Notes         string  `json:"notes"`
}

// --- M3: Personal ---
type CreateEmployeeRequest struct {
	FullName         string  `json:"full_name" binding:"required"`
	DocumentType     string  `json:"document_type"`
	DocumentNumber   string  `json:"document_number"`
	Phone            string  `json:"phone"`
	Address          string  `json:"address"`
	BirthDate        *string `json:"birth_date"`
	HireDate         *string `json:"hire_date"`
	ContractType     string  `json:"contract_type"`
	Role             string  `json:"role"`
	BaseSalary       float64 `json:"base_salary"`
	PayFrequency     string  `json:"pay_frequency"`
	BankName         string  `json:"bank_name"`
	BankAccount      string  `json:"bank_account"`
	EPS              string  `json:"eps"`
	AFP              string  `json:"afp"`
	ARL              string  `json:"arl"`
	CajaCompensacion string  `json:"caja_compensacion"`
	PhotoURL         string  `json:"photo_url"`
}

type UpdateEmployeeRequest struct {
	FullName         *string  `json:"full_name"`
	DocumentType     *string  `json:"document_type"`
	DocumentNumber   *string  `json:"document_number"`
	Phone            *string  `json:"phone"`
	Address          *string  `json:"address"`
	BirthDate        *string  `json:"birth_date"`
	HireDate         *string  `json:"hire_date"`
	ContractType     *string  `json:"contract_type"`
	Role             *string  `json:"role"`
	BaseSalary       *float64 `json:"base_salary"`
	PayFrequency     *string  `json:"pay_frequency"`
	BankName         *string  `json:"bank_name"`
	BankAccount      *string  `json:"bank_account"`
	EPS              *string  `json:"eps"`
	AFP              *string  `json:"afp"`
	ARL              *string  `json:"arl"`
	CajaCompensacion *string  `json:"caja_compensacion"`
	Status           *string  `json:"status"`
	PhotoURL         *string  `json:"photo_url"`
}

type CreateAttendanceRequest struct {
	Method string `json:"method"` // pin, selfie, qr, manual
}

// --- M4: Finanzas ---
type CreateExpenseRequest struct {
	Category      string   `json:"category"`
	Description   string   `json:"description"`
	Amount        float64  `json:"amount" binding:"required,gt=0"`
	PaymentMethod string   `json:"payment_method"`
	SupplierID    *string  `json:"supplier_id"`
	ReceiptURL    string   `json:"receipt_url"`
	Date          string   `json:"date" binding:"required"`
}

type UpdateExpenseRequest struct {
	Category      *string  `json:"category"`
	Description   *string  `json:"description"`
	Amount        *float64 `json:"amount"`
	PaymentMethod *string  `json:"payment_method"`
	SupplierID    *string  `json:"supplier_id"`
	ReceiptURL    *string  `json:"receipt_url"`
	Date          *string  `json:"date"`
}

// --- M5: Inventario ---
type CreateSupplyRequest struct {
	Name           string   `json:"name" binding:"required"`
	Unit           string   `json:"unit"`
	Stock          *float64 `json:"stock"`
	MinStock       *float64 `json:"min_stock"`
	EmergencyStock *float64 `json:"emergency_stock"`
	CostPerUnit    *float64 `json:"cost_per_unit"`
}

type UpdateSupplyRequest struct {
	Name           *string  `json:"name"`
	Unit           *string  `json:"unit"`
	Stock          *float64 `json:"stock"`
	MinStock       *float64 `json:"min_stock"`
	EmergencyStock *float64 `json:"emergency_stock"`
	CostPerUnit    *float64 `json:"cost_per_unit"`
}

type CreateSupplierRequest struct {
	Name         string `json:"name" binding:"required"`
	NIT          string `json:"nit"`
	ContactName  string `json:"contact_name"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	PaymentTerms string `json:"payment_terms"`
}

type CreatePurchaseOrderRequest struct {
	SupplierID    string                     `json:"supplier_id" binding:"required"`
	Items         []PurchaseOrderItemRequest `json:"items" binding:"required,min=1"`
	PaymentMethod string                     `json:"payment_method"`
	ReceiptURL    string                     `json:"receipt_url"`
	Date          string                     `json:"date" binding:"required"`
}

type PurchaseOrderItemRequest struct {
	ItemType  string  `json:"item_type" binding:"required"`
	ItemID    string  `json:"item_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required,gt=0"`
	UnitPrice float64 `json:"unit_price" binding:"required"`
}

// --- M6: Clientes ---
type CreateCustomerRequest struct {
	Name              string   `json:"name" binding:"required"`
	Document          string   `json:"document"`
	Phone             string   `json:"phone"`
	Email             string   `json:"email"`
	Type              string   `json:"type"`
	PreferredDiscount *float64 `json:"preferred_discount"`
	CreditApproved    *bool    `json:"credit_approved"`
	CreditLimit       *float64 `json:"credit_limit"`
	Notes             string   `json:"notes"`
}

type UpdateCustomerRequest struct {
	Name              *string  `json:"name"`
	Document          *string  `json:"document"`
	Phone             *string  `json:"phone"`
	Email             *string  `json:"email"`
	Type              *string  `json:"type"`
	PreferredDiscount *float64 `json:"preferred_discount"`
	CreditApproved    *bool    `json:"credit_approved"`
	CreditLimit       *float64 `json:"credit_limit"`
	Notes             *string  `json:"notes"`
}

type CreateRatingRequest struct {
	TurnID         string `json:"turn_id" binding:"required"`
	Score          int    `json:"score" binding:"required,min=1,max=5"`
	Comment        string `json:"comment"`
	WouldRecommend *bool  `json:"would_recommend"`
}

// --- M8: Configuracion ---
type UpdateWashConfigRequest struct {
	BusinessName  *string  `json:"business_name"`
	LogoURL       *string  `json:"logo_url"`
	NIT           *string  `json:"nit"`
	TaxRegime     *string  `json:"tax_regime"`
	Address       *string  `json:"address"`
	Phones        *string  `json:"phones"`
	Email         *string  `json:"email"`
	Schedule      *string  `json:"schedule"` // JSON string
	City          *string  `json:"city"`
	Currency      *string  `json:"currency"`
	Timezone      *string  `json:"timezone"`
	SMLMVValue    *float64 `json:"smlmv_value"`
	Holidays      *string  `json:"holidays"` // JSON string
	MultiLocation *bool    `json:"multi_location"`
}

type UpdateLoyaltyConfigRequest struct {
	PointsPerAmount  *float64 `json:"points_per_amount"`
	RedeemPoints     *int     `json:"redeem_points"`
	RedeemValue      *float64 `json:"redeem_value"`
	PointsExpiryDays *int     `json:"points_expiry_days"`
	Levels           *string  `json:"levels"` // JSON string
}

// --- Upload ---
type UploadRequest struct {
	Key         string `json:"key" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
	Bucket      string `json:"bucket"`
}
