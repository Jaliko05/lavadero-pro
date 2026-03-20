package handler

import (
	"fmt"
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// Redeem allows a customer to redeem loyalty points for a discount.
func (h *LoyaltyHandler) Redeem(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		CustomerID string `json:"customer_id" binding:"required"`
		Points     int    `json:"points" binding:"required,gt=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Get loyalty config
	var config domain.LoyaltyConfig
	if err := h.DB.TT(uc.ClientID, "loyalty_configs").First(&config).Error; err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "loyalty program not configured"})
		return
	}

	if req.Points < config.RedeemPoints {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: fmt.Sprintf("minimum %d points required to redeem", config.RedeemPoints)})
		return
	}

	// Calculate current points balance
	var earned, redeemed int
	h.DB.TT(uc.ClientID, "loyalty_transactions").
		Where("customer_id = ? AND type = ?", req.CustomerID, "earn").
		Select("COALESCE(SUM(points), 0)").Scan(&earned)
	h.DB.TT(uc.ClientID, "loyalty_transactions").
		Where("customer_id = ? AND type = ?", req.CustomerID, "redeem").
		Select("COALESCE(SUM(points), 0)").Scan(&redeemed)

	balance := earned - redeemed
	if req.Points > balance {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: fmt.Sprintf("insufficient points: balance is %d", balance)})
		return
	}

	// Calculate discount value
	multiplier := float64(req.Points) / float64(config.RedeemPoints)
	discountValue := multiplier * config.RedeemValue

	// Create redemption transaction
	tx := domain.LoyaltyTransaction{
		CustomerID:  req.CustomerID,
		ClientID:    uc.ClientID,
		Type:        "redeem",
		Points:      req.Points,
		Description: fmt.Sprintf("Redención de %d puntos por $%.0f", req.Points, discountValue),
	}
	h.DB.TT(uc.ClientID, "loyalty_transactions").Create(&tx)

	c.JSON(http.StatusOK, gin.H{
		"message":        "points redeemed successfully",
		"points_redeemed": req.Points,
		"discount_value": discountValue,
		"new_balance":    balance - req.Points,
	})
}

// GetCustomerPoints returns the current loyalty points balance for a customer.
func (h *LoyaltyHandler) GetCustomerPoints(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	customerID := c.Param("customer_id")

	var earned, redeemed int
	h.DB.TT(uc.ClientID, "loyalty_transactions").
		Where("customer_id = ? AND type = ?", customerID, "earn").
		Select("COALESCE(SUM(points), 0)").Scan(&earned)
	h.DB.TT(uc.ClientID, "loyalty_transactions").
		Where("customer_id = ? AND type = ?", customerID, "redeem").
		Select("COALESCE(SUM(points), 0)").Scan(&redeemed)

	var transactions []domain.LoyaltyTransaction
	h.DB.TT(uc.ClientID, "loyalty_transactions").
		Where("customer_id = ?", customerID).
		Order("created_at DESC").Limit(20).
		Find(&transactions)

	_ = gorm.DB{} // keep import

	c.JSON(http.StatusOK, gin.H{
		"customer_id":  customerID,
		"total_earned": earned,
		"total_redeemed": redeemed,
		"balance":      earned - redeemed,
		"transactions": transactions,
	})
}
