package routes

import (
	"net/http"

	"github.com/falcore/wash-service/internal/handler"
	"github.com/falcore/wash-service/internal/messaging"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func SetupRoutes(r *gin.Engine, db *repository.DBAdapter, producer *messaging.Producer) {
	// Initialize all handlers
	turnH := handler.NewTurnHandler(db)
	vehicleCatH := handler.NewVehicleCategoryHandler(db)
	washSvcH := handler.NewWashServiceHandler(db)
	clientH := handler.NewClientHandler(db)
	dashH := handler.NewDashboardHandler(db)
	uploadH := handler.NewUploadHandler(producer)
	ratingH := handler.NewRatingHandler(db)
	servicePriceH := handler.NewServicePriceHandler(db)
	servicePackageH := handler.NewServicePackageHandler(db)
	productH := handler.NewProductHandler(db)
	saleH := handler.NewSaleHandler(db)
	cashRegisterH := handler.NewCashRegisterHandler(db)
	employeeH := handler.NewEmployeeHandler(db)
	commissionH := handler.NewCommissionHandler(db)
	scheduleH := handler.NewScheduleHandler(db)
	payrollH := handler.NewPayrollHandler(db)
	expenseH := handler.NewExpenseHandler(db)
	supplyH := handler.NewSupplyHandler(db)
	supplierH := handler.NewSupplierHandler(db)
	purchaseOrderH := handler.NewPurchaseOrderHandler(db)
	inventoryH := handler.NewInventoryHandler(db)
	customerH := handler.NewCustomerHandler(db)
	loyaltyH := handler.NewLoyaltyHandler(db)
	discountH := handler.NewDiscountHandler(db)
	washConfigH := handler.NewWashConfigHandler(db)
	reportH := handler.NewReportHandler(db)

	// Observability
	r.GET("/wash/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/wash/metrics", gin.WrapH(promhttp.Handler()))

	wash := r.Group("/v1/wash")

	// ========================
	// PUBLIC ROUTES (no auth)
	// ========================
	pub := wash.Group("")
	pub.Use(middleware.OptionalAuthMiddleware())
	{
		pub.GET("/display/:client_id", turnH.Display)
		pub.GET("/turn-status/:turn_id", turnH.PublicTurnStatus)
		pub.POST("/ratings", ratingH.CreatePublic)
		pub.GET("/services", washSvcH.ListPublic)
		pub.GET("/clients/:id", clientH.Get)
	}

	// ========================
	// AUTHENTICATED ROUTES
	// ========================
	auth := wash.Group("")
	auth.Use(middleware.AuthMiddleware())
	{
		// Turns
		auth.POST("/turns", turnH.Create)
		auth.GET("/turns", turnH.List)
		auth.GET("/turns/:id", turnH.GetByID)
		auth.PATCH("/turns/:id/status", turnH.UpdateStatus)
		auth.PATCH("/turns/:id/assign", turnH.Assign)
		auth.POST("/turns/:id/services", turnH.AddService)
		auth.GET("/turns/:id/services", turnH.ListTurnServices)
		auth.GET("/turns/:id/history", turnH.GetStatusHistory)
		auth.GET("/turns/:id/photos", turnH.ListPhotos)
		auth.POST("/turns/:id/photos", turnH.CreatePhoto)
		auth.DELETE("/turns/:id/photos/:photo_id", turnH.DeletePhoto)

		// POS / Sales
		auth.POST("/sales", saleH.Create)
		auth.GET("/sales", saleH.List)
		auth.POST("/payments", saleH.CreatePayment)

		// Cash Register
		auth.POST("/cash-register/open", cashRegisterH.Open)
		auth.POST("/cash-register/close", cashRegisterH.Close)
		auth.GET("/cash-register/current", cashRegisterH.Current)

		// Customers (search)
		auth.GET("/customers/search", customerH.Search)
		auth.GET("/customers/:id/history", customerH.History)

		// My (employee/washer view)
		auth.GET("/my/turns", turnH.MyTurns)
		auth.PATCH("/my/turns/:id/status", turnH.UpdateStatus)
		auth.POST("/my/attendance", employeeH.MarkAttendance)

		// Client
		auth.GET("/clients/me", clientH.GetMyClient)
	}

	// ========================
	// ADMIN ROUTES
	// ========================
	admin := wash.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RequireRole("admin", "super_admin"))
	{
		// Dashboard
		admin.GET("/dashboard/stats", dashH.Stats)
		admin.GET("/dashboard/revenue-trend", dashH.RevenueTrend)
		admin.GET("/dashboard/turns-by-status", dashH.TurnsByStatus)
		admin.GET("/dashboard/top-services", dashH.TopServices)
		admin.GET("/dashboard/employee-ranking", dashH.EmployeeRanking)

		// Vehicle Categories
		admin.GET("/vehicle-categories", vehicleCatH.List)
		admin.POST("/vehicle-categories", vehicleCatH.Create)
		admin.PUT("/vehicle-categories/:id", vehicleCatH.Update)
		admin.DELETE("/vehicle-categories/:id", vehicleCatH.Delete)

		// Wash Services
		admin.GET("/services", washSvcH.AdminList)
		admin.POST("/services", washSvcH.Create)
		admin.PUT("/services/:id", washSvcH.Update)
		admin.DELETE("/services/:id", washSvcH.Delete)

		// Service Prices
		admin.GET("/service-prices", servicePriceH.List)
		admin.POST("/service-prices", servicePriceH.Create)
		admin.PUT("/service-prices/:id", servicePriceH.Update)
		admin.DELETE("/service-prices/:id", servicePriceH.Delete)

		// Service Packages
		admin.GET("/service-packages", servicePackageH.List)
		admin.POST("/service-packages", servicePackageH.Create)
		admin.PUT("/service-packages/:id", servicePackageH.Update)
		admin.DELETE("/service-packages/:id", servicePackageH.Delete)

		// Products
		admin.GET("/products", productH.List)
		admin.POST("/products", productH.Create)
		admin.PUT("/products/:id", productH.Update)
		admin.DELETE("/products/:id", productH.Delete)

		// Supplies
		admin.GET("/supplies", supplyH.List)
		admin.POST("/supplies", supplyH.Create)
		admin.PUT("/supplies/:id", supplyH.Update)
		admin.DELETE("/supplies/:id", supplyH.Delete)

		// Supply Consumptions
		admin.GET("/supply-consumptions", supplyH.ListConsumptions)
		admin.POST("/supply-consumptions", supplyH.CreateConsumption)
		admin.PUT("/supply-consumptions/:id", supplyH.UpdateConsumption)
		admin.DELETE("/supply-consumptions/:id", supplyH.DeleteConsumption)

		// Employees
		admin.GET("/employees", employeeH.List)
		admin.GET("/employees/:id", employeeH.Get)
		admin.POST("/employees", employeeH.Create)
		admin.PUT("/employees/:id", employeeH.Update)
		admin.DELETE("/employees/:id", employeeH.Delete)
		admin.GET("/employees/:id/attendance", employeeH.GetAttendance)

		// Commissions
		admin.GET("/commissions", commissionH.List)
		admin.POST("/commissions", commissionH.Create)
		admin.PUT("/commissions/:id", commissionH.Update)
		admin.DELETE("/commissions/:id", commissionH.Delete)

		// Schedules
		admin.GET("/schedules", scheduleH.List)
		admin.POST("/schedules", scheduleH.Create)
		admin.PUT("/schedules/:id", scheduleH.Update)
		admin.DELETE("/schedules/:id", scheduleH.Delete)

		// Payroll
		admin.POST("/payroll/generate", payrollH.Generate)
		admin.GET("/payroll", payrollH.List)
		admin.GET("/payroll/:id", payrollH.Get)
		admin.PATCH("/payroll/:id/approve", payrollH.Approve)

		// Customers
		admin.GET("/customers", customerH.List)
		admin.GET("/customers/:id", customerH.Get)
		admin.POST("/customers", customerH.Create)
		admin.PUT("/customers/:id", customerH.Update)
		admin.DELETE("/customers/:id", customerH.Delete)

		// Customer Vehicles
		admin.GET("/customer-vehicles", customerH.ListVehicles)
		admin.POST("/customer-vehicles", customerH.CreateVehicle)
		admin.PUT("/customer-vehicles/:id", customerH.UpdateVehicle)
		admin.DELETE("/customer-vehicles/:id", customerH.DeleteVehicle)

		// Loyalty
		admin.GET("/loyalty-config", loyaltyH.GetConfig)
		admin.PUT("/loyalty-config", loyaltyH.UpdateConfig)
		admin.POST("/loyalty/redeem", loyaltyH.Redeem)
		admin.GET("/loyalty/customers/:customer_id/points", loyaltyH.GetCustomerPoints)

		// Inventory
		admin.GET("/inventory/alerts", inventoryH.Alerts)
		admin.POST("/inventory/count", inventoryH.Count)

		// Suppliers
		admin.GET("/suppliers", supplierH.List)
		admin.POST("/suppliers", supplierH.Create)
		admin.PUT("/suppliers/:id", supplierH.Update)
		admin.DELETE("/suppliers/:id", supplierH.Delete)

		// Purchase Orders
		admin.GET("/purchase-orders", purchaseOrderH.List)
		admin.POST("/purchase-orders", purchaseOrderH.Create)
		admin.GET("/purchase-orders/:id", purchaseOrderH.Get)
		admin.DELETE("/purchase-orders/:id", purchaseOrderH.Delete)

		// Incomes
		admin.GET("/incomes", expenseH.ListIncomes)
		admin.POST("/incomes", expenseH.CreateIncome)
		admin.PUT("/incomes/:id", expenseH.UpdateIncome)
		admin.DELETE("/incomes/:id", expenseH.DeleteIncome)

		// Expenses
		admin.GET("/expenses", expenseH.ListExpenses)
		admin.POST("/expenses", expenseH.CreateExpense)
		admin.PUT("/expenses/:id", expenseH.UpdateExpense)
		admin.DELETE("/expenses/:id", expenseH.DeleteExpense)

		// Recurring Expenses
		admin.GET("/recurring-expenses", expenseH.ListRecurring)
		admin.POST("/recurring-expenses", expenseH.CreateRecurring)
		admin.PUT("/recurring-expenses/:id", expenseH.UpdateRecurring)
		admin.DELETE("/recurring-expenses/:id", expenseH.DeleteRecurring)

		// Accounts Receivable
		admin.GET("/accounts-receivable", expenseH.ListAccountsReceivable)
		admin.POST("/accounts-receivable", expenseH.CreateAccountReceivable)
		admin.POST("/accounts-receivable/:id/pay", expenseH.PayAccountReceivable)

		// Cash Flow & P&L
		admin.GET("/cash-flow", expenseH.CashFlow)
		admin.GET("/profit-loss", expenseH.ProfitLoss)

		// Discounts
		admin.GET("/discounts", discountH.List)
		admin.POST("/discounts", discountH.Create)
		admin.PUT("/discounts/:id", discountH.Update)
		admin.DELETE("/discounts/:id", discountH.Delete)

		// Reports
		admin.GET("/reports/sales", reportH.Sales)
		admin.GET("/reports/vehicles", reportH.Vehicles)
		admin.GET("/reports/attendance", reportH.Attendance)
		admin.GET("/reports/performance", reportH.Performance)
		admin.GET("/reports/payroll", reportH.PayrollReport)
		admin.GET("/reports/clients", reportH.Clients)
		admin.GET("/reports/inventory", reportH.Inventory)
		admin.GET("/reports/inventory-movements", reportH.InventoryMovements)
		admin.GET("/reports/:type/csv", reportH.CSVExport)

		// Config
		admin.GET("/config", washConfigH.GetConfig)
		admin.PUT("/config", washConfigH.UpdateConfig)

		// Locations
		admin.GET("/locations", washConfigH.ListLocations)
		admin.POST("/locations", washConfigH.CreateLocation)
		admin.PUT("/locations/:id", washConfigH.UpdateLocation)
		admin.DELETE("/locations/:id", washConfigH.DeleteLocation)

		// Notification Templates
		admin.GET("/notification-templates", washConfigH.ListNotificationTemplates)
		admin.POST("/notification-templates", washConfigH.CreateNotificationTemplate)
		admin.PUT("/notification-templates/:id", washConfigH.UpdateNotificationTemplate)
		admin.DELETE("/notification-templates/:id", washConfigH.DeleteNotificationTemplate)

		// Upload (R2 storage)
		admin.POST("/upload/request-url", uploadH.RequestUploadURL)
		admin.GET("/upload/file-url", uploadH.GetFileURL)
		admin.DELETE("/upload/file", uploadH.DeleteFile)
	}

	// ========================
	// SUPER ADMIN ROUTES
	// ========================
	superAdmin := wash.Group("/super-admin")
	superAdmin.Use(middleware.AuthMiddleware())
	superAdmin.Use(middleware.RequireRole("super_admin"))
	{
		superAdmin.POST("/clients", clientH.Create)
		superAdmin.GET("/clients", clientH.List)
		superAdmin.PUT("/clients/:id", clientH.Update)
		superAdmin.DELETE("/clients/:id", clientH.Delete)
	}
}
