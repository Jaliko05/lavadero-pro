package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Client is the shared/public tenant entity (lives in public schema).
type Client struct {
	ID           string         `json:"id" gorm:"type:uuid;primaryKey"`
	Nombre       string         `json:"nombre" gorm:"not null"`
	NIT          string         `json:"nit"`
	Email        string         `json:"email" gorm:"not null"`
	Telefono     string         `json:"telefono"`
	Direccion    string         `json:"direccion"`
	Ciudad       string         `json:"ciudad"`
	Departamento string         `json:"departamento"`
	LogoURL      string         `json:"logo_url"`
	Moneda       string         `json:"moneda" gorm:"default:'COP'"`
	Impuesto     float64        `json:"impuesto" gorm:"default:0"`
	TipoImpuesto string        `json:"tipo_impuesto" gorm:"default:'IVA'"`
	Plan         string         `json:"plan" gorm:"default:'basico'"`
	Activo       bool           `json:"activo" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (c *Client) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}
