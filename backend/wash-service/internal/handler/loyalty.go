package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type LoyaltyHandler struct{ DB *repository.DBAdapter }

func NewLoyaltyHandler(db *repository.DBAdapter) *LoyaltyHandler {
	return &LoyaltyHandler{DB: db}
}

func (h *LoyaltyHandler) GetConfig(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var config domain.LoyaltyConfig
	if err := h.DB.TT(uc.ClientID, "loyalty_configs").First(&config).Error; err != nil {
		// Return default config
		c.JSON(http.StatusOK, domain.LoyaltyConfig{
			ClientID:        uc.ClientID,
			PointsPerAmount: 1000,
			RedeemPoints:    100,
			RedeemValue:     5000,
			PointsExpiryDays: 365,
		})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *LoyaltyHandler) UpdateConfig(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		PointsPerAmount  float64 `json:"points_per_amount"`
		RedeemPoints     int     `json:"redeem_points"`
		RedeemValue      float64 `json:"redeem_value"`
		PointsExpiryDays int     `json:"points_expiry_days"`
		Levels           string  `json:"levels"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var existing domain.LoyaltyConfig
	err := h.DB.TT(uc.ClientID, "loyalty_configs").First(&existing).Error
	if err != nil {
		// Create new
		config := domain.LoyaltyConfig{
			ClientID:         uc.ClientID,
			PointsPerAmount:  req.PointsPerAmount,
			RedeemPoints:     req.RedeemPoints,
			RedeemValue:      req.RedeemValue,
			PointsExpiryDays: req.PointsExpiryDays,
			Levels:           req.Levels,
		}
		h.DB.TT(uc.ClientID, "loyalty_configs").Create(&config)
		c.JSON(http.StatusCreated, config)
		return
	}

	updates := map[string]interface{}{
		"points_per_amount":  req.PointsPerAmount,
		"redeem_points":      req.RedeemPoints,
		"redeem_value":       req.RedeemValue,
		"points_expiry_days": req.PointsExpiryDays,
		"levels":             req.Levels,
	}
	h.DB.TT(uc.ClientID, "loyalty_configs").Where("id = ?", existing.ID).Updates(updates)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "loyalty config updated"})
}
