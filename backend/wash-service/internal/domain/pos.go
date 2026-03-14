package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// --- M2: POS / Tienda ---

type Product struct {
	ID        string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID  string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name      string         `json:"name" gorm:"not null"`
	Code      string         `json:"code"`
	Barcode   string         `json:"barcode"`
	Category  string         `json:"category"`
	SalePrice float64        `json:"sale_price" gorm:"not null"`
	CostPrice float64        `json:"cost_price" gorm:"default:0"`
	Stock     int            `json:"stock" gorm:"default:0"`
	MinStock  int            `json:"min_stock" gorm:"default:0"`
	IVARate   float64        `json:"iva_rate" gorm:"default:0"`
	Status    string         `json:"status" gorm:"default:'activo'"`
	ImageURL  string         `json:"image_url"`
	Tags      pq.StringArray `json:"tags" gorm:"type:text[]"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type Sale struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID      string         `json:"client_id" gorm:"type:uuid;not null;index"`
	TurnID        *string        `json:"turn_id" gorm:"type:uuid;index"`
	CashierID     string         `json:"cashier_id" gorm:"type:uuid;not null"`
	Subtotal      float64        `json:"subtotal" gorm:"default:0"`
	Discount      float64        `json:"discount" gorm:"default:0"`
	Tax           float64        `json:"tax" gorm:"default:0"`
	Total         float64        `json:"total" gorm:"default:0"`
	PaymentStatus string         `json:"payment_status" gorm:"default:'pendiente'"`
	Notes         string         `json:"notes"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *Sale) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type SaleItem struct {
	ID        string         `json:"id" gorm:"type:uuid;primaryKey"`
	SaleID    string         `json:"sale_id" gorm:"type:uuid;not null;index"`
	ItemType  string         `json:"item_type" gorm:"not null"` // service, product
	ItemID    string         `json:"item_id" gorm:"type:uuid;not null"`
	Name      string         `json:"name"`
	Quantity  int            `json:"quantity" gorm:"default:1"`
	UnitPrice float64        `json:"unit_price" gorm:"default:0"`
	Subtotal  float64        `json:"subtotal" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *SaleItem) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type Payment struct {
	ID        string         `json:"id" gorm:"type:uuid;primaryKey"`
	SaleID    string         `json:"sale_id" gorm:"type:uuid;not null;index"`
	ClientID  string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Method    string         `json:"method" gorm:"not null"` // efectivo, nequi, daviplata, transferencia, tarjeta, mixto, fiado
	Amount    float64        `json:"amount" gorm:"not null"`
	Reference string         `json:"reference"`
	Confirmed bool           `json:"confirmed" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type CashRegister struct {
	ID             string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID       string         `json:"client_id" gorm:"type:uuid;not null;index"`
	CashierID      string         `json:"cashier_id" gorm:"type:uuid;not null"`
	OpenedAt       time.Time      `json:"opened_at"`
	ClosedAt       *time.Time     `json:"closed_at"`
	OpeningAmount  float64        `json:"opening_amount" gorm:"default:0"`
	ClosingAmount  float64        `json:"closing_amount" gorm:"default:0"`
	ExpectedAmount float64        `json:"expected_amount" gorm:"default:0"`
	Difference     float64        `json:"difference" gorm:"default:0"`
	Status         string         `json:"status" gorm:"default:'open'"` // open, closed
	Notes          string         `json:"notes"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (c *CashRegister) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" { c.ID = uuid.New().String() }
	return nil
}

type Discount struct {
	ID          string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID    string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name        string         `json:"name" gorm:"not null"`
	Type        string         `json:"type" gorm:"not null"` // percentage, fixed
	Value       float64        `json:"value" gorm:"not null"`
	Code        string         `json:"code" gorm:"index"`
	ValidFrom   *time.Time     `json:"valid_from"`
	ValidUntil  *time.Time     `json:"valid_until"`
	MaxUses     int            `json:"max_uses" gorm:"default:0"`
	CurrentUses int            `json:"current_uses" gorm:"default:0"`
	Active      bool           `json:"active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (d *Discount) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" { d.ID = uuid.New().String() }
	return nil
}
