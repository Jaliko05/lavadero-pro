package handler

import (
	"encoding/csv"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ReportHandler struct{ DB *repository.DBAdapter }

func NewReportHandler(db *repository.DBAdapter) *ReportHandler {
	return &ReportHandler{DB: db}
}

func (h *ReportHandler) defaultRange(c *gin.Context) (string, string) {
	from := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))
	return from, to
}

func (h *ReportHandler) Sales(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	var totalSales float64
	var salesCount int64
	h.DB.TT(uc.ClientID, "sales").Where("created_at >= ? AND created_at <= ?", from, to).Count(&salesCount)
	h.DB.TT(uc.ClientID, "sales").Where("created_at >= ? AND created_at <= ?", from, to).Select("COALESCE(SUM(total),0)").Row().Scan(&totalSales)

	// By payment method
	type MethodSummary struct {
		Method string  `json:"method"`
		Total  float64 `json:"total"`
		Count  int64   `json:"count"`
	}
	var byMethod []MethodSummary
	h.DB.TT(uc.ClientID, "payments").
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("method, SUM(amount) as total, COUNT(*) as count").
		Group("method").Scan(&byMethod)

	c.JSON(http.StatusOK, gin.H{
		"from": from, "to": to,
		"total_sales": totalSales,
		"sales_count": salesCount,
		"by_method":   byMethod,
	})
}

func (h *ReportHandler) Vehicles(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	baseQ := h.DB.TT(uc.ClientID, "turns").Where("created_at >= ? AND created_at <= ?", from, to)
	if empID := c.Query("employee_id"); empID != "" {
		baseQ = baseQ.Where("assigned_employee_id = ?", empID)
	}
	if catID := c.Query("category_id"); catID != "" {
		baseQ = baseQ.Where("vehicle_category_id = ?", catID)
	}

	var turnsCount int64
	baseQ.Count(&turnsCount)

	type CategoryCount struct {
		VehicleCategoryID string `json:"vehicle_category_id"`
		Count             int64  `json:"count"`
	}
	var byCategory []CategoryCount
	h.DB.TT(uc.ClientID, "turns").
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("vehicle_category_id, COUNT(*) as count").
		Group("vehicle_category_id").Scan(&byCategory)

	type StatusCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var byStatus []StatusCount
	h.DB.TT(uc.ClientID, "turns").
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("status, COUNT(*) as count").
		Group("status").Scan(&byStatus)

	c.JSON(http.StatusOK, gin.H{
		"from": from, "to": to,
		"total_turns": turnsCount,
		"by_category": byCategory,
		"by_status":   byStatus,
	})
}

func (h *ReportHandler) Attendance(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	type EmpAttendance struct {
		EmployeeID   string `json:"employee_id"`
		PresentDays  int64  `json:"present_days"`
		AbsentDays   int64  `json:"absent_days"`
		LateDays     int64  `json:"late_days"`
	}
	var records []EmpAttendance
	h.DB.TT(uc.ClientID, "employee_attendances").
		Where("date >= ? AND date <= ?", from, to).
		Select(`employee_id,
			SUM(CASE WHEN status = 'presente' THEN 1 ELSE 0 END) as present_days,
			SUM(CASE WHEN status LIKE '%ausencia%' THEN 1 ELSE 0 END) as absent_days,
			SUM(CASE WHEN late_minutes > 0 THEN 1 ELSE 0 END) as late_days`).
		Group("employee_id").Scan(&records)

	c.JSON(http.StatusOK, gin.H{"from": from, "to": to, "attendance": records})
}

func (h *ReportHandler) Performance(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	type EmpPerformance struct {
		AssignedEmployeeID string  `json:"assigned_employee_id"`
		TurnsCompleted     int64   `json:"turns_completed"`
		AvgRating          float64 `json:"avg_rating"`
	}
	var records []EmpPerformance
	q := h.DB.TT(uc.ClientID, "turns").
		Where("created_at >= ? AND created_at <= ? AND status = ?", from, to, "DELIVERED")
	if empID := c.Query("employee_id"); empID != "" {
		q = q.Where("assigned_employee_id = ?", empID)
	}
	q.Select("assigned_employee_id, COUNT(*) as turns_completed").
		Group("assigned_employee_id").Scan(&records)

	// Enrich with ratings
	for i, r := range records {
		var avg float64
		h.DB.TT(uc.ClientID, "ratings").
			Where("employee_id = ? AND created_at >= ? AND created_at <= ?", r.AssignedEmployeeID, from, to).
			Select("COALESCE(AVG(score),0)").Row().Scan(&avg)
		records[i].AvgRating = avg
	}

	c.JSON(http.StatusOK, gin.H{"from": from, "to": to, "performance": records})
}

func (h *ReportHandler) PayrollReport(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	type PayrollSummary struct {
		ID              string  `json:"id"`
		PeriodStart     string  `json:"period_start"`
		PeriodEnd       string  `json:"period_end"`
		Status          string  `json:"status"`
		TotalGross      float64 `json:"total_gross"`
		TotalDeductions float64 `json:"total_deductions"`
		TotalNet        float64 `json:"total_net"`
	}
	var payrolls []PayrollSummary
	h.DB.TT(uc.ClientID, "payrolls").
		Where("period_start >= ? AND period_end <= ?", from, to).
		Select("id, period_start, period_end, status, total_gross, total_deductions, total_net").
		Scan(&payrolls)

	c.JSON(http.StatusOK, gin.H{"from": from, "to": to, "payrolls": payrolls})
}

func (h *ReportHandler) Clients(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	var totalCustomers int64
	h.DB.TT(uc.ClientID, "customer_profiles").Count(&totalCustomers)

	var newCustomers int64
	h.DB.TT(uc.ClientID, "customer_profiles").Where("created_at >= ? AND created_at <= ?", from, to).Count(&newCustomers)

	type TopCustomer struct {
		CustomerID string  `json:"customer_id"`
		Visits     int64   `json:"visits"`
		TotalSpent float64 `json:"total_spent"`
	}
	var topCustomers []TopCustomer
	h.DB.TT(uc.ClientID, "turns").
		Where("created_at >= ? AND created_at <= ? AND customer_id IS NOT NULL", from, to).
		Select("customer_id, COUNT(*) as visits, COALESCE(SUM(total_price),0) as total_spent").
		Group("customer_id").Order("visits DESC").Limit(10).Scan(&topCustomers)

	c.JSON(http.StatusOK, gin.H{
		"from": from, "to": to,
		"total_customers": totalCustomers,
		"new_customers":   newCustomers,
		"top_customers":   topCustomers,
	})
}

func (h *ReportHandler) Inventory(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	type ProductStock struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Stock    int    `json:"stock"`
		MinStock int    `json:"min_stock"`
	}
	var products []ProductStock
	h.DB.TT(uc.ClientID, "products").Select("id, name, stock, min_stock").Order("stock ASC").Scan(&products)

	type SupplyStock struct {
		ID       string  `json:"id"`
		Name     string  `json:"name"`
		Stock    float64 `json:"stock"`
		MinStock float64 `json:"min_stock"`
		Unit     string  `json:"unit"`
	}
	var supplies []SupplyStock
	h.DB.TT(uc.ClientID, "wash_supplies").Select("id, name, stock, min_stock, unit").Order("stock ASC").Scan(&supplies)

	_ = dto.ErrorResponse{} // keep import

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"supplies": supplies,
	})
}

// InventoryMovements returns a list of inventory movements with optional filters.
func (h *ReportHandler) InventoryMovements(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	var movements []domain.InventoryMovement
	q := h.DB.TT(uc.ClientID, "inventory_movements").Where("date >= ? AND date <= ?", from, to)
	if itemType := c.Query("item_type"); itemType != "" {
		q = q.Where("item_type = ?", itemType)
	}
	if movType := c.Query("movement_type"); movType != "" {
		q = q.Where("movement_type = ?", movType)
	}
	q.Order("created_at DESC").Find(&movements)

	c.JSON(http.StatusOK, gin.H{
		"from":      from,
		"to":        to,
		"movements": movements,
	})
}

// Profitability calculates margin per wash service.
func (h *ReportHandler) Profitability(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)

	// Get all active wash services
	var services []domain.WashService
	h.DB.TT(uc.ClientID, "wash_services").Find(&services)

	type ServiceProfit struct {
		ServiceID   string  `json:"service_id"`
		ServiceName string  `json:"service_name"`
		Revenue     float64 `json:"revenue"`
		SupplyCost  float64 `json:"supply_cost"`
		LaborCost   float64 `json:"labor_cost"`
		Margin      float64 `json:"margin"`
		MarginPct   float64 `json:"margin_pct"`
		TurnCount   int64   `json:"turn_count"`
	}

	var results []ServiceProfit

	for _, svc := range services {
		sp := ServiceProfit{
			ServiceID:   svc.ID,
			ServiceName: svc.Name,
		}

		// 1. Revenue: SUM of turn_services.price for delivered turns in date range
		h.DB.TT(uc.ClientID, "turn_services").
			Joins("JOIN turns ON turns.id = turn_services.turn_id AND turns.client_id = turn_services.client_id").
			Where("turn_services.wash_service_id = ? AND turns.status = ? AND turns.created_at >= ? AND turns.created_at <= ?",
				svc.ID, "DELIVERED", from, to).
			Select("COALESCE(SUM(turn_services.price),0)").Row().Scan(&sp.Revenue)

		// Count of turns for this service
		h.DB.TT(uc.ClientID, "turn_services").
			Joins("JOIN turns ON turns.id = turn_services.turn_id AND turns.client_id = turn_services.client_id").
			Where("turn_services.wash_service_id = ? AND turns.status = ? AND turns.created_at >= ? AND turns.created_at <= ?",
				svc.ID, "DELIVERED", from, to).
			Select("COUNT(DISTINCT turns.id)").Row().Scan(&sp.TurnCount)

		if sp.TurnCount == 0 {
			results = append(results, sp)
			continue
		}

		// 2. Supply cost: sum of (quantity_per_service * cost_per_unit) * number of turns
		var supplyCostPerService float64
		h.DB.TT(uc.ClientID, "supply_consumptions").
			Joins("JOIN wash_supplies ON wash_supplies.id = supply_consumptions.wash_supply_id AND wash_supplies.client_id = supply_consumptions.client_id").
			Where("supply_consumptions.wash_service_id = ?", svc.ID).
			Select("COALESCE(SUM(supply_consumptions.quantity_per_service * wash_supplies.cost_per_unit),0)").
			Row().Scan(&supplyCostPerService)
		sp.SupplyCost = supplyCostPerService * float64(sp.TurnCount)

		// 3. Labor cost: avg time per turn (estimated_time_minutes) * avg hourly rate of assigned employees / 60
		var avgMinutes float64
		h.DB.TT(uc.ClientID, "turns").
			Joins("JOIN turn_services ON turn_services.turn_id = turns.id AND turn_services.client_id = turns.client_id").
			Where("turn_services.wash_service_id = ? AND turns.status = ? AND turns.created_at >= ? AND turns.created_at <= ?",
				svc.ID, "DELIVERED", from, to).
			Select("COALESCE(AVG(turns.estimated_minutes),0)").Row().Scan(&avgMinutes)
		if avgMinutes == 0 {
			avgMinutes = float64(svc.EstimatedTimeMinutes)
		}

		var avgHourlyRate float64
		h.DB.TT(uc.ClientID, "employees").
			Where("role = ? AND status = ?", "lavador", "activo").
			Select("COALESCE(AVG(base_salary / 240),0)").Row().Scan(&avgHourlyRate) // 240 = 30 days * 8 hours
		sp.LaborCost = math.Round((avgMinutes/60.0)*avgHourlyRate*float64(sp.TurnCount)*100) / 100

		// 4. Margin
		sp.Margin = math.Round((sp.Revenue-sp.SupplyCost-sp.LaborCost)*100) / 100

		// 5. Margin %
		if sp.Revenue > 0 {
			sp.MarginPct = math.Round(sp.Margin/sp.Revenue*10000) / 100
		}

		results = append(results, sp)
	}

	c.JSON(http.StatusOK, gin.H{
		"from":          from,
		"to":            to,
		"profitability": results,
	})
}

// CSVExport exports report data as CSV.
func (h *ReportHandler) CSVExport(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from, to := h.defaultRange(c)
	reportType := c.Param("type")

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s_%s_%s.csv", reportType, from, to))

	w := csv.NewWriter(c.Writer)
	defer w.Flush()

	switch reportType {
	case "sales":
		w.Write([]string{"ID", "Total", "Status", "Fecha"})
		type SaleRow struct {
			ID        string  `json:"id"`
			Total     float64 `json:"total"`
			Status    string  `json:"status"`
			CreatedAt string  `json:"created_at"`
		}
		var rows []SaleRow
		h.DB.TT(uc.ClientID, "sales").Where("created_at >= ? AND created_at <= ?", from, to).
			Select("id, total, status, created_at").Order("created_at DESC").Scan(&rows)
		for _, r := range rows {
			w.Write([]string{r.ID, fmt.Sprintf("%.0f", r.Total), r.Status, r.CreatedAt})
		}

	case "vehicles":
		w.Write([]string{"Turno ID", "Placa", "Categoría", "Estado", "Precio Total", "Fecha"})
		type TurnRow struct {
			ID                string  `json:"id"`
			Plate             string  `json:"plate"`
			VehicleCategoryID string  `json:"vehicle_category_id"`
			Status            string  `json:"status"`
			TotalPrice        float64 `json:"total_price"`
			CreatedAt         string  `json:"created_at"`
		}
		var rows []TurnRow
		h.DB.TT(uc.ClientID, "turns").Where("created_at >= ? AND created_at <= ?", from, to).
			Select("id, plate, vehicle_category_id, status, total_price, created_at").Order("created_at DESC").Scan(&rows)
		for _, r := range rows {
			w.Write([]string{r.ID, r.Plate, r.VehicleCategoryID, r.Status, fmt.Sprintf("%.0f", r.TotalPrice), r.CreatedAt})
		}

	case "attendance":
		w.Write([]string{"Empleado ID", "Fecha", "Estado", "Check In", "Check Out", "Minutos Tarde"})
		type AttRow struct {
			EmployeeID  string `json:"employee_id"`
			Date        string `json:"date"`
			Status      string `json:"status"`
			CheckIn     string `json:"check_in"`
			CheckOut    string `json:"check_out"`
			LateMinutes int    `json:"late_minutes"`
		}
		var rows []AttRow
		h.DB.TT(uc.ClientID, "employee_attendances").Where("date >= ? AND date <= ?", from, to).
			Select("employee_id, date, status, check_in, check_out, late_minutes").Order("date DESC").Scan(&rows)
		for _, r := range rows {
			w.Write([]string{r.EmployeeID, r.Date, r.Status, r.CheckIn, r.CheckOut, fmt.Sprintf("%d", r.LateMinutes)})
		}

	case "expenses":
		w.Write([]string{"ID", "Categoría", "Descripción", "Monto", "Método Pago", "Fecha"})
		var rows []domain.Expense
		h.DB.TT(uc.ClientID, "expenses").Where("date >= ? AND date <= ?", from, to).Order("date DESC").Find(&rows)
		for _, r := range rows {
			w.Write([]string{r.ID, r.Category, r.Description, fmt.Sprintf("%.0f", r.Amount), r.PaymentMethod, r.Date.Format("2006-01-02")})
		}

	case "incomes":
		w.Write([]string{"ID", "Categoría", "Descripción", "Monto", "Método Pago", "Tipo", "Fecha"})
		var rows []domain.Income
		h.DB.TT(uc.ClientID, "incomes").Where("date >= ? AND date <= ?", from, to).Order("date DESC").Find(&rows)
		for _, r := range rows {
			w.Write([]string{r.ID, r.Category, r.Description, fmt.Sprintf("%.0f", r.Amount), r.PaymentMethod, r.SourceType, r.Date.Format("2006-01-02")})
		}

	default:
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "unsupported report type: " + reportType})
		return
	}
}
