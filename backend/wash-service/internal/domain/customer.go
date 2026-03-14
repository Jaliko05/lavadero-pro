package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M6: Clientes y Fidelizacion ---

type CustomerProfile struct {
	ID                string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID          string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name              string         `json:"name" gorm:"not null"`
	Document          string         `json:"document"`
	Phone             string         `json:"phone" gorm:"index"`
	Email             string         `json:"email"`
	Type              string         `json:"type" gorm:"default:'natural'"` // natural, empresa, flota
	PreferredDiscount float64        `json:"preferred_discount" gorm:"default:0"`
	CreditApproved    bool           `json:"credit_approved" gorm:"default:false"`
	CreditLimit       float64        `json:"credit_limit" gorm:"default:0"`
	Notes             string         `json:"notes"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (c *CustomerProfile) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" { c.ID = uuid.New().String() }
	return nil
}

type CustomerVehicle struct {
	ID                string         `json:"id" gorm:"type:uuid;primaryKey"`
	CustomerID        string         `json:"customer_id" gorm:"type:uuid;not null;index"`
	ClientID          string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Plate             string         `json:"plate" gorm:"not null;index"`
	VehicleCategoryID string         `json:"vehicle_category_id" gorm:"type:uuid"`
	Nickname          string         `json:"nickname"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (c *CustomerVehicle) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" { c.ID = uuid.New().String() }
	return nil
}

type LoyaltyConfig struct {
	ID               string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID         string         `json:"client_id" gorm:"type:uuid;not null;uniqueIndex"`
	PointsPerAmount  float64        `json:"points_per_amount" gorm:"default:1"`  // points earned per X COP
	RedeemPoints     int            `json:"redeem_points" gorm:"default:100"`    // points needed to redeem
	RedeemValue      float64        `json:"redeem_value" gorm:"default:5000"`    // COP value when redeeming
	PointsExpiryDays int            `json:"points_expiry_days" gorm:"default:365"`
	Levels           string         `json:"levels" gorm:"type:jsonb"` // JSONB for level tiers
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (l *LoyaltyConfig) BeforeCreate(tx *gorm.DB) error {
	if l.ID == "" { l.ID = uuid.New().String() }
	return nil
}

type LoyaltyTransaction struct {
	ID          string    `json:"id" gorm:"type:uuid;primaryKey"`
	CustomerID  string    `json:"customer_id" gorm:"type:uuid;not null;index"`
	ClientID    string    `json:"client_id" gorm:"type:uuid;not null;index"`
	Type        string    `json:"type" gorm:"not null"` // earn, redeem, expire
	Points      int       `json:"points" gorm:"not null"`
	Reference   string    `json:"reference"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func (l *LoyaltyTransaction) BeforeCreate(tx *gorm.DB) error {
	if l.ID == "" { l.ID = uuid.New().String() }
	return nil
}

type Rating struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID       string    `json:"client_id" gorm:"type:uuid;not null;index"`
	TurnID         string    `json:"turn_id" gorm:"type:uuid;not null;index"`
	CustomerID     *string   `json:"customer_id" gorm:"type:uuid;index"`
	EmployeeID     *string   `json:"employee_id" gorm:"type:uuid;index"`
	Score          int       `json:"score" gorm:"not null"` // 1-5
	Comment        string    `json:"comment"`
	WouldRecommend *bool     `json:"would_recommend"`
	CreatedAt      time.Time `json:"created_at"`
}

func (r *Rating) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" { r.ID = uuid.New().String() }
	return nil
}

type NotificationTemplate struct {
	ID              string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID        string         `json:"client_id" gorm:"type:uuid;not null;index"`
	TriggerEvent    string         `json:"trigger_event" gorm:"not null"` // turn_ready, turn_delivered, loyalty_reward, etc.
	MessageTemplate string         `json:"message_template" gorm:"not null"`
	Channel         string         `json:"channel" gorm:"default:'whatsapp'"` // whatsapp, email
	Active          bool           `json:"active" gorm:"default:true"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (n *NotificationTemplate) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" { n.ID = uuid.New().String() }
	return nil
}
