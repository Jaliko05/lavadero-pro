package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type RatingHandler struct {
	DB *repository.DBAdapter
}

func NewRatingHandler(db *repository.DBAdapter) *RatingHandler {
	return &RatingHandler{DB: db}
}

// CreatePublic allows a customer to rate a turn without authentication.
func (h *RatingHandler) CreatePublic(c *gin.Context) {
	clientID := c.Query("client_id")
	if clientID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "client_id query parameter required"})
		return
	}

	var req dto.CreateRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Verify turn exists
	var turn domain.Turn
	if err := h.DB.TT(clientID, "turns").Where("id = ?", req.TurnID).First(&turn).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "turn not found"})
		return
	}

	rating := domain.Rating{
		ClientID:       clientID,
		TurnID:         req.TurnID,
		CustomerID:     turn.CustomerID,
		EmployeeID:     turn.AssignedEmployeeID,
		Score:          req.Score,
		Comment:        req.Comment,
		WouldRecommend: req.WouldRecommend,
	}

	if err := h.DB.TT(clientID, "ratings").Create(&rating).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating rating"})
		return
	}

	c.JSON(http.StatusCreated, rating)
}
