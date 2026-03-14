package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M1: Gestion del Lavadero ---

type VehicleCategory struct {
	ID       string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name     string         `json:"name" gorm:"not null"`
	Icon     string         `json:"icon"`
	ParentID *string        `json:"parent_id" gorm:"type:uuid;index"`
	Orden    int            `json:"orden" gorm:"default:0"`
	Activo   bool           `json:"activo" gorm:"default:true"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (v *VehicleCategory) BeforeCreate(tx *gorm.DB) error {
	if v.ID == "" { v.ID = uuid.New().String() }
	return nil
}

type WashService struct {
	ID                   string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID             string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name                 string         `json:"name" gorm:"not null"`
	Description          string         `json:"description"`
	Category             string         `json:"category"` // basico, premium, detailing
	Status               string         `json:"status" gorm:"default:'activo'"` // activo, inactivo
	EstimatedTimeMinutes int            `json:"estimated_time_minutes" gorm:"default:30"`
	ImageURL             string         `json:"image_url"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (w *WashService) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" { w.ID = uuid.New().String() }
	return nil
}

type ServicePrice struct {
	ID                string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID          string         `json:"client_id" gorm:"type:uuid;not null;index"`
	WashServiceID     string         `json:"wash_service_id" gorm:"type:uuid;not null;index"`
	VehicleCategoryID string         `json:"vehicle_category_id" gorm:"type:uuid;not null;index"`
	Price             float64        `json:"price" gorm:"not null"`
	Currency          string         `json:"currency" gorm:"default:'COP'"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *ServicePrice) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type ServicePackage struct {
	ID                 string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID           string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Name               string         `json:"name" gorm:"not null"`
	Description        string         `json:"description"`
	DiscountPercentage float64        `json:"discount_percentage" gorm:"default:0"`
	Activo             bool           `json:"activo" gorm:"default:true"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *ServicePackage) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type ServicePackageItem struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	PackageID     string         `json:"package_id" gorm:"type:uuid;not null;index"`
	WashServiceID string         `json:"wash_service_id" gorm:"type:uuid;not null"`
	CreatedAt     time.Time      `json:"created_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (s *ServicePackageItem) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" { s.ID = uuid.New().String() }
	return nil
}

type Turn struct {
	ID                 string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID           string         `json:"client_id" gorm:"type:uuid;not null;index"`
	DailyNumber        int            `json:"daily_number"`
	Plate              string         `json:"plate" gorm:"not null;index"`
	VehicleCategoryID  string         `json:"vehicle_category_id" gorm:"type:uuid;not null"`
	CustomerID         *string        `json:"customer_id" gorm:"type:uuid;index"`
	AssignedEmployeeID *string        `json:"assigned_employee_id" gorm:"type:uuid;index"`
	Status             string         `json:"status" gorm:"default:'WAITING'"` // WAITING, IN_PROGRESS, DONE, DELIVERED, PAUSED, CANCELLED
	Priority           int            `json:"priority" gorm:"default:0"`
	Observations       string         `json:"observations"`
	StartedAt          *time.Time     `json:"started_at"`
	FinishedAt         *time.Time     `json:"finished_at"`
	DeliveredAt        *time.Time     `json:"delivered_at"`
	EstimatedMinutes   int            `json:"estimated_minutes" gorm:"default:0"`
	TotalPrice         float64        `json:"total_price" gorm:"default:0"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (t *Turn) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" { t.ID = uuid.New().String() }
	return nil
}

type TurnService struct {
	ID            string         `json:"id" gorm:"type:uuid;primaryKey"`
	TurnID        string         `json:"turn_id" gorm:"type:uuid;not null;index"`
	WashServiceID string         `json:"wash_service_id" gorm:"type:uuid;not null"`
	Price         float64        `json:"price" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (t *TurnService) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" { t.ID = uuid.New().String() }
	return nil
}

type TurnStatusHistory struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	TurnID    string    `json:"turn_id" gorm:"type:uuid;not null;index"`
	FromStatus string   `json:"from_status"`
	ToStatus  string    `json:"to_status" gorm:"not null"`
	ChangedBy string    `json:"changed_by" gorm:"type:uuid"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

func (t *TurnStatusHistory) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" { t.ID = uuid.New().String() }
	return nil
}

type TurnPhoto struct {
	ID        string         `json:"id" gorm:"type:uuid;primaryKey"`
	TurnID    string         `json:"turn_id" gorm:"type:uuid;not null;index"`
	PhotoURL  string         `json:"photo_url" gorm:"not null"`
	PhotoType string         `json:"photo_type"` // entry, exit
	Angle     string         `json:"angle"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (t *TurnPhoto) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" { t.ID = uuid.New().String() }
	return nil
}
