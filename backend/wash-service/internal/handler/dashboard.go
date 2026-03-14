package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	DB *repository.DBAdapter
}

func NewDashboardHandler(db *repository.DBAdapter) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	cid := uc.ClientID

	var stats dto.DashboardStatsResponse

	// Total revenue from sales
	h.DB.TT(cid, "sales").Select("COALESCE(SUM(total), 0)").Scan(&stats.TotalVentas)

	// Total turns
	h.DB.TT(cid, "turns").Where("deleted_at IS NULL").Count(&stats.TotalTurnos)

	// Turns today
	h.DB.TT(cid, "turns").Where("DATE(created_at) = DATE(NOW()) AND deleted_at IS NULL").Count(&stats.TurnosHoy)

	// Turns in progress
	h.DB.TT(cid, "turns").Where("status = 'IN_PROGRESS' AND deleted_at IS NULL").Count(&stats.TurnosEnCurso)

	// Turns waiting
	h.DB.TT(cid, "turns").Where("status = 'WAITING' AND deleted_at IS NULL").Count(&stats.TurnosEsperando)

	// Total employees
	h.DB.TT(cid, "employees").Where("status = 'activo' AND deleted_at IS NULL").Count(&stats.TotalEmpleados)

	// Total customers
	h.DB.TT(cid, "customer_profiles").Where("deleted_at IS NULL").Count(&stats.TotalClientes)

	// Month revenue
	h.DB.TT(cid, "sales").
		Where("DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())").
		Select("COALESCE(SUM(total), 0)").Scan(&stats.VentasMes)

	// Average rating
	h.DB.TT(cid, "ratings").Select("COALESCE(AVG(score), 0)").Scan(&stats.PromedioCalif)

	// Low stock products
	h.DB.TT(cid, "products").Where("stock <= min_stock AND status = 'activo' AND deleted_at IS NULL").Count(&stats.ProductosSinStock)

	// Low stock supplies
	h.DB.TT(cid, "wash_supplies").Where("stock <= min_stock AND deleted_at IS NULL").Count(&stats.InsumosBajoStock)

	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) RevenueTrend(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	days := c.DefaultQuery("days", "30")

	var data []dto.RevenueDataPoint
	h.DB.TT(uc.ClientID, "sales").
		Select("DATE(created_at) as fecha, COALESCE(SUM(total), 0) as total, COUNT(*) as count").
		Where("created_at >= NOW() - INTERVAL '"+days+" days'").
		Group("DATE(created_at)").
		Order("fecha ASC").
		Scan(&data)

	c.JSON(http.StatusOK, data)
}

func (h *DashboardHandler) TurnsByStatus(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	var data []dto.TurnsByStatusResponse
	h.DB.TT(uc.ClientID, "turns").
		Where("DATE(created_at) = DATE(NOW()) AND deleted_at IS NULL").
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&data)

	c.JSON(http.StatusOK, data)
}

func (h *DashboardHandler) TopServices(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	var data []dto.TopServiceResponse
	h.DB.TT(uc.ClientID, "turn_services").
		Select("wash_service_id as service_id, COUNT(*) as count, COALESCE(SUM(price), 0) as revenue").
		Group("wash_service_id").
		Order("count DESC").
		Limit(10).
		Scan(&data)

	c.JSON(http.StatusOK, data)
}

func (h *DashboardHandler) EmployeeRanking(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	var data []dto.EmployeeRankingResponse
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_employee_id IS NOT NULL AND deleted_at IS NULL").
		Select("assigned_employee_id as employee_id, COUNT(*) as turns_count").
		Group("assigned_employee_id").
		Order("turns_count DESC").
		Limit(10).
		Scan(&data)

	c.JSON(http.StatusOK, data)
}
