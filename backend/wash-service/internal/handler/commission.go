package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type CommissionHandler struct{ DB *repository.DBAdapter }

func NewCommissionHandler(db *repository.DBAdapter) *CommissionHandler {
	return &CommissionHandler{DB: db}
}

func (h *CommissionHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var commissions []domain.Commission
	if err := h.DB.TT(uc.ClientID, "commissions").Find(&commissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading commissions"})
		return
	}
	c.JSON(http.StatusOK, commissions)
}

func (h *CommissionHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		EmployeeID  string  `json:"employee_id" binding:"required"`
		Type        string  `json:"type" binding:"required"`
		Value       float64 `json:"value" binding:"required"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	com := domain.Commission{
		ClientID:    uc.ClientID,
		EmployeeID:  req.EmployeeID,
		Type:        req.Type,
		Value:       req.Value,
		Description: req.Description,
		Active:      true,
	}
	if err := h.DB.TT(uc.ClientID, "commissions").Create(&com).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating commission"})
		return
	}
	c.JSON(http.StatusCreated, com)
}

func (h *CommissionHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Type        *string  `json:"type"`
		Value       *float64 `json:"value"`
		Description *string  `json:"description"`
		Active      *bool    `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Type != nil { updates["type"] = *req.Type }
	if req.Value != nil { updates["value"] = *req.Value }
	if req.Description != nil { updates["description"] = *req.Description }
	if req.Active != nil { updates["active"] = *req.Active }
	result := h.DB.TT(uc.ClientID, "commissions").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating commission"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "commission not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "commission updated"})
}

func (h *CommissionHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "commissions").Where("id = ?", c.Param("id")).Delete(&domain.Commission{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting commission"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "commission not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "commission deleted"})
}
