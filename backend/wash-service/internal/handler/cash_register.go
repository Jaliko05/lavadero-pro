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

type CashRegisterHandler struct{ DB *repository.DBAdapter }

func NewCashRegisterHandler(db *repository.DBAdapter) *CashRegisterHandler {
	return &CashRegisterHandler{DB: db}
}

func (h *CashRegisterHandler) Open(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.OpenCashRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Check if there's already an open register
	var count int64
	h.DB.TT(uc.ClientID, "cash_registers").Where("cashier_id = ? AND status = ?", uc.UserID, "open").Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, dto.ErrorResponse{Error: "ya tienes una caja abierta"})
		return
	}

	cr := domain.CashRegister{
		ClientID:      uc.ClientID,
		CashierID:     uc.UserID,
		OpenedAt:      time.Now(),
		OpeningAmount: req.OpeningAmount,
		Status:        "open",
	}
	if err := h.DB.TT(uc.ClientID, "cash_registers").Create(&cr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error opening register"})
		return
	}
	c.JSON(http.StatusCreated, cr)
}

func (h *CashRegisterHandler) Close(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CloseCashRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var cr domain.CashRegister
	if err := h.DB.TT(uc.ClientID, "cash_registers").Where("cashier_id = ? AND status = ?", uc.UserID, "open").First(&cr).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "no hay caja abierta"})
		return
	}

	// Calculate expected amount from payments during this register's open time
	var totalSales float64
	h.DB.TT(uc.ClientID, "payments").
		Where("created_at >= ? AND confirmed = ?", cr.OpenedAt, true).
		Select("COALESCE(SUM(amount),0)").Row().Scan(&totalSales)

	now := time.Now()
	expected := cr.OpeningAmount + totalSales

	updates := map[string]interface{}{
		"closed_at":       &now,
		"closing_amount":  req.ClosingAmount,
		"expected_amount": expected,
		"difference":      req.ClosingAmount - expected,
		"status":          "closed",
		"notes":           req.Notes,
	}

	h.DB.TT(uc.ClientID, "cash_registers").Where("id = ?", cr.ID).Updates(updates)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "caja cerrada"})
}

func (h *CashRegisterHandler) Current(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var cr domain.CashRegister
	if err := h.DB.TT(uc.ClientID, "cash_registers").Where("cashier_id = ? AND status = ?", uc.UserID, "open").First(&cr).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "no hay caja abierta"})
		return
	}
	c.JSON(http.StatusOK, cr)
}
