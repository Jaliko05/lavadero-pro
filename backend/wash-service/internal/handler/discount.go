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

type DiscountHandler struct{ DB *repository.DBAdapter }

func NewDiscountHandler(db *repository.DBAdapter) *DiscountHandler {
	return &DiscountHandler{DB: db}
}

func (h *DiscountHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var discounts []domain.Discount
	if err := h.DB.TT(uc.ClientID, "discounts").Order("created_at DESC").Find(&discounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading discounts"})
		return
	}
	c.JSON(http.StatusOK, discounts)
}

func (h *DiscountHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name       string   `json:"name" binding:"required"`
		Type       string   `json:"type" binding:"required"`
		Value      float64  `json:"value" binding:"required"`
		Code       string   `json:"code"`
		ValidFrom  *string  `json:"valid_from"`
		ValidUntil *string  `json:"valid_until"`
		MaxUses    *int     `json:"max_uses"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	var maxUses int
	if req.MaxUses != nil {
		maxUses = *req.MaxUses
	}
	discount := domain.Discount{
		ClientID: uc.ClientID,
		Name:     req.Name,
		Type:     req.Type,
		Value:    req.Value,
		Code:     req.Code,
		MaxUses:  maxUses,
		Active:   true,
	}
	if req.ValidFrom != nil {
		t, _ := time.Parse("2006-01-02", *req.ValidFrom)
		discount.ValidFrom = &t
	}
	if req.ValidUntil != nil {
		t, _ := time.Parse("2006-01-02", *req.ValidUntil)
		discount.ValidUntil = &t
	}
	if err := h.DB.TT(uc.ClientID, "discounts").Create(&discount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating discount"})
		return
	}
	c.JSON(http.StatusCreated, discount)
}

func (h *DiscountHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name       *string  `json:"name"`
		Type       *string  `json:"type"`
		Value      *float64 `json:"value"`
		Code       *string  `json:"code"`
		MaxUses    *int     `json:"max_uses"`
		Active     *bool    `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Type != nil { updates["type"] = *req.Type }
	if req.Value != nil { updates["value"] = *req.Value }
	if req.Code != nil { updates["code"] = *req.Code }
	if req.MaxUses != nil { updates["max_uses"] = *req.MaxUses }
	if req.Active != nil { updates["active"] = *req.Active }
	result := h.DB.TT(uc.ClientID, "discounts").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "discount not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "discount updated"})
}

func (h *DiscountHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "discounts").Where("id = ?", c.Param("id")).Delete(&domain.Discount{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "discount not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "discount deleted"})
}
