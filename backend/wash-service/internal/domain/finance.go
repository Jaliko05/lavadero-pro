package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M4: Finanzas ---

type Income struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID      string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Category      string         `json:"category"`
	Description   string         `json:"description"`
	Amount        float64        `json:"amount" gorm:"not null"`
	PaymentMethod string         `json:"payment_method"`
	SourceType    string         `json:"source_type"` // sale, manual
	SourceID      *string        `json:"source_id" gorm:"type:uuid"`
	RegisteredBy  string         `json:"registered_by" gorm:"type:uuid"`
	Date          time.Time      `json:"date" gorm:"type:date;not null"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (i *Income) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" { i.ID = uuid.New().String() }
	return nil
}

type Expense struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID      string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Category      string         `json:"category"`
	Description   string         `json:"description"`
	Amount        float64        `json:"amount" gorm:"not null"`
	PaymentMethod string         `json:"payment_method"`
	SupplierID    *string        `json:"supplier_id" gorm:"type:uuid;index"`
	ReceiptURL    string         `json:"receipt_url"`
	RegisteredBy  string         `json:"registered_by" gorm:"type:uuid"`
	Date          time.Time      `json:"date" gorm:"type:date;not null"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (e *Expense) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" { e.ID = uuid.New().String() }
	return nil
}

type RecurringExpense struct {
	ID        string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID  string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name      string         `json:"name" gorm:"not null"`
	Category  string         `json:"category"`
	Amount    float64        `json:"amount" gorm:"not null"`
	Frequency string         `json:"frequency" gorm:"default:'monthly'"` // monthly, biweekly, quarterly
	DueDay    int            `json:"due_day" gorm:"default:1"`
	Active    bool           `json:"active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (r *RecurringExpense) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" { r.ID = uuid.New().String() }
	return nil
}

type AccountReceivable struct {
	ID         string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID   string         `json:"client_id" gorm:"type:uuid;not null;index"`
	CustomerID string         `json:"customer_id" gorm:"type:uuid;not null;index"`
	SaleID     *string        `json:"sale_id" gorm:"type:uuid;index"`
	TotalAmount float64       `json:"total_amount" gorm:"not null"`
	PaidAmount  float64       `json:"paid_amount" gorm:"default:0"`
	DueDate    *time.Time     `json:"due_date"`
	Status     string         `json:"status" gorm:"default:'al_dia'"` // al_dia, en_mora, vencida
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (a *AccountReceivable) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" { a.ID = uuid.New().String() }
	return nil
}
