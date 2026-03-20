package handler

import (
	"net/http"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type PayrollHandler struct{ DB *repository.DBAdapter }

func NewPayrollHandler(db *repository.DBAdapter) *PayrollHandler {
	return &PayrollHandler{DB: db}
}

func (h *PayrollHandler) Generate(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		PeriodStart string `json:"period_start" binding:"required"`
		PeriodEnd   string `json:"period_end" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	periodStart, _ := time.Parse("2006-01-02", req.PeriodStart)
	periodEnd, _ := time.Parse("2006-01-02", req.PeriodEnd)

	// Get active employees
	var employees []domain.Employee
	h.DB.TT(uc.ClientID, "employees").Where("status = ?", "activo").Find(&employees)

	payroll := domain.Payroll{
		ClientID:    uc.ClientID,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		Status:      "draft",
	}

	tx := h.DB.TT(uc.ClientID, "payrolls").Begin()
	if err := tx.Create(&payroll).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating payroll"})
		return
	}

	var totalGross, totalDeductions, totalNet float64

	for _, emp := range employees {
		// Count worked days
		var workedDays int64
		h.DB.TT(uc.ClientID, "employee_attendances").
			Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", emp.ID, req.PeriodStart, req.PeriodEnd, "presente").
			Count(&workedDays)

		// Sum commissions
		var commissionTotal float64
		h.DB.TT(uc.ClientID, "commissions").
			Where("employee_id = ? AND active = ?", emp.ID, true).
			Select("COALESCE(SUM(value),0)").Row().Scan(&commissionTotal)

		grossTotal := emp.BaseSalary + commissionTotal
		healthDeduction := grossTotal * 0.04
		pensionDeduction := grossTotal * 0.04
		netPay := grossTotal - healthDeduction - pensionDeduction

		item := domain.PayrollItem{
			PayrollID:       payroll.ID,
			EmployeeID:      emp.ID,
			BaseSalary:      emp.BaseSalary,
			WorkedDays:      int(workedDays),
			Commissions:     commissionTotal,
			GrossTotal:      grossTotal,
			HealthDeduction: healthDeduction,
			PensionDeduction: pensionDeduction,
			NetPay:          netPay,
		}
		tx.Table("payroll_items").Create(&item)

		totalGross += grossTotal
		totalDeductions += healthDeduction + pensionDeduction
		totalNet += netPay
	}

	tx.Table("payrolls").Where("id = ?", payroll.ID).Updates(map[string]interface{}{
		"total_gross":      totalGross,
		"total_deductions": totalDeductions,
		"total_net":        totalNet,
	})
	tx.Commit()

	c.JSON(http.StatusCreated, payroll)
}

func (h *PayrollHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var payrolls []domain.Payroll
	if err := h.DB.TT(uc.ClientID, "payrolls").Order("period_start DESC").Find(&payrolls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading payrolls"})
		return
	}
	c.JSON(http.StatusOK, payrolls)
}

func (h *PayrollHandler) Get(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var payroll domain.Payroll
	if err := h.DB.TT(uc.ClientID, "payrolls").Where("id = ?", c.Param("id")).First(&payroll).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "payroll not found"})
		return
	}
	var items []domain.PayrollItem
	h.DB.TT(uc.ClientID, "payroll_items").Where("payroll_id = ?", payroll.ID).Find(&items)
	c.JSON(http.StatusOK, gin.H{"payroll": payroll, "items": items})
}

func (h *PayrollHandler) Approve(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "payrolls").Where("id = ? AND status = ?", c.Param("id"), "draft").Update("status", "approved")
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "payroll not found or already approved"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "payroll approved"})
}
