package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// --- M3: Personal ---

type Employee struct {
	ID               string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID         string         `json:"client_id" gorm:"type:uuid;not null;index"`
	UserID           *string        `json:"user_id" gorm:"type:uuid;index"`
	FullName         string         `json:"full_name" gorm:"not null"`
	DocumentType     string         `json:"document_type"` // CC, CE, TI, NIT
	DocumentNumber   string         `json:"document_number"`
	Phone            string         `json:"phone"`
	Address          string         `json:"address"`
	BirthDate        *time.Time     `json:"birth_date"`
	HireDate         *time.Time     `json:"hire_date"`
	ContractType     string         `json:"contract_type"` // fijo, indefinido, obra_labor, prestacion_servicios
	Role             string         `json:"role"`          // lavador, cajero, recepcionista, admin
	BaseSalary       float64        `json:"base_salary" gorm:"default:0"`
	PaymentType      string         `json:"payment_type" gorm:"default:'fixed_salary'"` // fixed_salary, per_wash, percentage
	AmountPerWash    float64        `json:"amount_per_wash" gorm:"default:0"`
	PercentageRate   float64        `json:"percentage_rate" gorm:"default:0"`
	PayFrequency     string         `json:"pay_frequency" gorm:"default:'quincenal'"` // semanal, quincenal, mensual
	BankName         string         `json:"bank_name"`
	BankAccount      string         `json:"bank_account"`
	EPS              string         `json:"eps"`
	AFP              string         `json:"afp"`
	ARL              string         `json:"arl"`
	CajaCompensacion string        `json:"caja_compensacion"`
	Status           string         `json:"status" gorm:"default:'activo'"` // activo, vacaciones, incapacitado, retirado
	PhotoURL         string         `json:"photo_url"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (e *Employee) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" { e.ID = uuid.New().String() }
	return nil
}

type EmployeeAttendance struct {
	ID         string         `json:"id" gorm:"type:uuid;primaryKey"`
	EmployeeID string         `json:"employee_id" gorm:"type:uuid;not null;index"`
	ClientID   string         `json:"client_id" gorm:"type:uuid;not null;index"`
	Date       time.Time      `json:"date" gorm:"type:date;not null"`
	CheckIn    *time.Time     `json:"check_in"`
	CheckOut   *time.Time     `json:"check_out"`
	Method     string         `json:"method"` // pin, selfie, qr, manual
	LateMinutes int           `json:"late_minutes" gorm:"default:0"`
	Status     string         `json:"status" gorm:"default:'presente'"` // presente, ausencia_justificada, ausencia_injustificada, incapacidad, permiso, vacaciones
	Notes      string         `json:"notes"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (e *EmployeeAttendance) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" { e.ID = uuid.New().String() }
	return nil
}

type EmployeeSchedule struct {
	ID         string         `json:"id" gorm:"type:uuid;primaryKey"`
	EmployeeID string         `json:"employee_id" gorm:"type:uuid;not null;index"`
	ClientID   string         `json:"client_id" gorm:"type:uuid;not null;index"`
	DayOfWeek  int            `json:"day_of_week" gorm:"not null"` // 0=Sunday..6=Saturday
	ShiftName  string         `json:"shift_name"`
	StartTime  string         `json:"start_time"` // HH:MM
	EndTime    string         `json:"end_time"`   // HH:MM
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (e *EmployeeSchedule) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" { e.ID = uuid.New().String() }
	return nil
}

type Payroll struct {
	ID              string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID        string         `json:"client_id" gorm:"type:uuid;not null;index"`
	PeriodStart     time.Time      `json:"period_start" gorm:"type:date;not null"`
	PeriodEnd       time.Time      `json:"period_end" gorm:"type:date;not null"`
	Status          string         `json:"status" gorm:"default:'draft'"` // draft, approved, paid
	TotalGross      float64        `json:"total_gross" gorm:"default:0"`
	TotalDeductions float64        `json:"total_deductions" gorm:"default:0"`
	TotalNet        float64        `json:"total_net" gorm:"default:0"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *Payroll) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type PayrollItem struct {
	ID                 string         `json:"id" gorm:"type:uuid;primaryKey"`
	PayrollID          string         `json:"payroll_id" gorm:"type:uuid;not null;index"`
	EmployeeID         string         `json:"employee_id" gorm:"type:uuid;not null;index"`
	BaseSalary         float64        `json:"base_salary" gorm:"default:0"`
	WorkedDays         int            `json:"worked_days" gorm:"default:0"`
	OvertimeHours      float64        `json:"overtime_hours" gorm:"default:0"`
	OvertimeValue      float64        `json:"overtime_value" gorm:"default:0"`
	TransportAllowance float64        `json:"transport_allowance" gorm:"default:0"`
	Commissions        float64        `json:"commissions" gorm:"default:0"`
	Bonuses            float64        `json:"bonuses" gorm:"default:0"`
	GrossTotal         float64        `json:"gross_total" gorm:"default:0"`
	HealthDeduction    float64        `json:"health_deduction" gorm:"default:0"`
	PensionDeduction   float64        `json:"pension_deduction" gorm:"default:0"`
	OtherDeductions    float64        `json:"other_deductions" gorm:"default:0"`
	NetPay             float64        `json:"net_pay" gorm:"default:0"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (p *PayrollItem) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" { p.ID = uuid.New().String() }
	return nil
}

type Commission struct {
	ID          string         `json:"id" gorm:"type:uuid;primaryKey"`
	ClientID    string         `json:"client_id" gorm:"type:uuid;not null;index"`
	EmployeeID  string         `json:"employee_id" gorm:"type:uuid;not null;index"`
	Type        string         `json:"type" gorm:"not null"` // per_vehicle, per_service, percentage, goal_bonus, punctuality
	Value       float64        `json:"value" gorm:"not null"`
	Description string         `json:"description"`
	Active      bool           `json:"active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

func (c *Commission) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" { c.ID = uuid.New().String() }
	return nil
}
