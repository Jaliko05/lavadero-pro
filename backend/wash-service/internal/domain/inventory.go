package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M5: Inventario ---

type WashSupply struct {
	ID             string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID       string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name           string         `json:"name" gorm:"not null"`
	Unit           string         `json:"unit"` // litros, unidades, recargas
	Stock          float64        `json:"stock" gorm:"default:0"`
	MinStock       float64        `json:"min_stock" gorm:"default:0"`
	EmergencyStock float64        `json:"emergency_stock" gorm:"default:0"`
	CostPerUnit    float64        `json:"cost_per_unit" gorm:"default:0"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (w *WashSupply) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" { w.ID = uuid.New().String() }
	return nil
}

type SupplyConsumption struct {
	ID                 string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID           string         `json:"client_id" gorm:"type:uuid;not null;index"`
	WashServiceID      string         `json:"wash_service_id" gorm:"type:uuid;not null;index"`
	WashSupplyID       string         `json:"wash_supply_id" gorm:"type:uuid;not null;index"`
	QuantityPerService float64        `json:"quantity_per_service" gorm:"not null"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *SupplyConsumption) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type Supplier struct {
	ID           string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID     string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name         string         `json:"name" gorm:"not null"`
	NIT          string         `json:"nit"`
	ContactName  string         `json:"contact_name"`
	Phone        string         `json:"phone"`
	Email        string         `json:"email"`
	PaymentTerms string         `json:"payment_terms"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *Supplier) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type PurchaseOrder struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID      string         `json:"client_id" gorm:"type:uuid;not null;index"`
	SupplierID    string         `json:"supplier_id" gorm:"type:uuid;not null;index"`
	Total         float64        `json:"total" gorm:"default:0"`
	PaymentMethod string         `json:"payment_method"`
	ReceiptURL    string         `json:"receipt_url"`
	Date          time.Time      `json:"date" gorm:"type:date;not null"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *PurchaseOrder) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type PurchaseOrderItem struct {
	ID              string         `json:"id" gorm:"type:uuid;primaryKey"`
	PurchaseOrderID string         `json:"purchase_order_id" gorm:"type:uuid;not null;index"`
	ItemType        string         `json:"item_type" gorm:"not null"` // product, supply
	ItemID          string         `json:"item_id" gorm:"type:uuid;not null"`
	Quantity        float64        `json:"quantity" gorm:"not null"`
	UnitPrice       float64        `json:"unit_price" gorm:"default:0"`
	CreatedAt       time.Time      `json:"created_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *PurchaseOrderItem) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type InventoryMovement struct {
	ID           string    `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID     string    `json:"client_id" gorm:"type:uuid;not null;index"`
	ItemType     string    `json:"item_type" gorm:"not null"` // product, supply
	ItemID       string    `json:"item_id" gorm:"type:uuid;not null;index"`
	MovementType string    `json:"movement_type" gorm:"not null"` // purchase, sale, consumption, adjustment
	Quantity     float64   `json:"quantity" gorm:"not null"`
	BalanceAfter float64   `json:"balance_after" gorm:"default:0"`
	Reference    string    `json:"reference"`
	Date         time.Time `json:"date" gorm:"type:date;not null"`
	CreatedAt    time.Time `json:"created_at"`
}

func (i *InventoryMovement) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" { i.ID = uuid.New().String() }
	return nil
}
