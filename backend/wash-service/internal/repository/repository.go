package repository

import (
	"fmt"
	"log"

	"github.com/falcore/wash-service/config"
	"github.com/falcore/wash-service/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DBAdapter struct {
	DB *gorm.DB
}

func NewDB(cfg *config.Config) *DBAdapter {
	logLevel := logger.Silent
	if cfg.LogLevel == "debug" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DBConn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Only migrate shared tables in public schema
	if err := db.AutoMigrate(&domain.Client{}); err != nil {
		log.Fatalf("failed to auto-migrate public schema: %v", err)
	}

	return &DBAdapter{DB: db}
}

// CreateTenantSchema creates the PostgreSQL schema for a tenant and migrates
// all tenant-specific tables into it.
func (d *DBAdapter) CreateTenantSchema(clientID string) error {
	schema := SchemaName(clientID)

	if err := d.DB.Exec(fmt.Sprintf(`CREATE SCHEMA IF NOT EXISTS "%s"`, schema)).Error; err != nil {
		return fmt.Errorf("failed to create schema %s: %w", schema, err)
	}

	return d.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(fmt.Sprintf(`SET LOCAL search_path TO "%s"`, schema)).Error; err != nil {
			return err
		}
		return tx.AutoMigrate(
			// M1 - Gestion del Lavadero
			&domain.VehicleCategory{},
			&domain.WashService{},
			&domain.ServicePrice{},
			&domain.ServicePackage{},
			&domain.ServicePackageItem{},
			&domain.Turn{},
			&domain.TurnService{},
			&domain.TurnStatusHistory{},
			&domain.TurnPhoto{},

			// M2 - POS / Tienda
			&domain.Product{},
			&domain.Sale{},
			&domain.SaleItem{},
			&domain.Payment{},
			&domain.CashRegister{},
			&domain.Discount{},

			// M3 - Personal
			&domain.Employee{},
			&domain.EmployeeAttendance{},
			&domain.EmployeeSchedule{},
			&domain.Payroll{},
			&domain.PayrollItem{},
			&domain.Commission{},

			// M4 - Finanzas
			&domain.Income{},
			&domain.Expense{},
			&domain.RecurringExpense{},
			&domain.AccountReceivable{},

			// M5 - Inventario
			&domain.WashSupply{},
			&domain.SupplyConsumption{},
			&domain.Supplier{},
			&domain.PurchaseOrder{},
			&domain.PurchaseOrderItem{},
			&domain.InventoryMovement{},

			// M6 - Clientes y Fidelizacion
			&domain.CustomerProfile{},
			&domain.CustomerVehicle{},
			&domain.LoyaltyConfig{},
			&domain.LoyaltyTransaction{},
			&domain.Rating{},
			&domain.NotificationTemplate{},

			// M8 - Configuracion
			&domain.WashConfig{},
			&domain.Location{},
		)
	})
}

// TT returns a *gorm.DB scoped to the tenant's schema for the given table.
// This is the core multi-tenant helper — all tenant queries must use this.
func (d *DBAdapter) TT(clientID, table string) *gorm.DB {
	return d.DB.Table(fmt.Sprintf(`"%s"."%s"`, SchemaName(clientID), table))
}

// TTUser returns a *gorm.DB scoped to the tenant's schema filtered by user_id.
func (d *DBAdapter) TTUser(clientID, userID, table string) *gorm.DB {
	return d.TT(clientID, table).Where("user_id = ?", userID)
}

// RawExpr returns a gorm.Expr for raw SQL expressions (e.g. "stock - ?").
func RawExpr(expr string, args ...interface{}) interface{} {
	return gorm.Expr(expr, args...)
}
