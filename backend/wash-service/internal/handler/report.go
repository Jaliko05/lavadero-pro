package handler

import (
	"net/http"
	"time"

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

	var turnsCount int64
	h.DB.TT(uc.ClientID, "turns").Where("created_at >= ? AND created_at <= ?", from, to).Count(&turnsCount)

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
	h.DB.TT(uc.ClientID, "turns").
		Where("created_at >= ? AND created_at <= ? AND status = ?", from, to, "DELIVERED").
		Select("assigned_employee_id, COUNT(*) as turns_completed").
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
