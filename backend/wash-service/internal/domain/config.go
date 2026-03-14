package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M8: Configuracion ---

type WashConfig struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID      string         `json:"client_id" gorm:"type:uuid;not null;uniqueIndex"`
	BusinessName  string         `json:"business_name"`
	LogoURL       string         `json:"logo_url"`
	NIT           string         `json:"nit"`
	TaxRegime     string         `json:"tax_regime"`
	Address       string         `json:"address"`
	Phones        string         `json:"phones"`
	Email         string         `json:"email"`
	Schedule      string         `json:"schedule" gorm:"type:jsonb"` // JSONB: hours per day
	City          string         `json:"city"`
	Currency      string         `json:"currency" gorm:"default:'COP'"`
	Timezone      string         `json:"timezone" gorm:"default:'America/Bogota'"`
	SMLMVValue    float64        `json:"smlmv_value" gorm:"default:1300000"`
	Holidays      string         `json:"holidays" gorm:"type:jsonb"` // JSONB: custom holidays
	MultiLocation bool           `json:"multi_location" gorm:"default:false"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (w *WashConfig) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" { w.ID = uuid.New().String() }
	return nil
}

type Location struct {
	ID       string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name     string         `json:"name" gorm:"not null"`
	Address  string         `json:"address"`
	Phone    string         `json:"phone"`
	Active   bool           `json:"active" gorm:"default:true"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (l *Location) BeforeCreate(tx *gorm.DB) error {
	if l.ID == "" { l.ID = uuid.New().String() }
	return nil
}
