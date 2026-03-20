package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ServicePriceHandler struct{ DB *repository.DBAdapter }

func NewServicePriceHandler(db *repository.DBAdapter) *ServicePriceHandler {
	return &ServicePriceHandler{DB: db}
}

func (h *ServicePriceHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var prices []domain.ServicePrice
	q := h.DB.TT(uc.ClientID, "service_prices")
	if sid := c.Query("wash_service_id"); sid != "" {
		q = q.Where("wash_service_id = ?", sid)
	}
	if err := q.Find(&prices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading prices"})
		return
	}
	c.JSON(http.StatusOK, prices)
}

func (h *ServicePriceHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateServicePriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	sp := domain.ServicePrice{
		ClientID:          uc.ClientID,
		WashServiceID:     req.WashServiceID,
		VehicleCategoryID: req.VehicleCategoryID,
		Price:             req.Price,
		Currency:          req.Currency,
	}
	if sp.Currency == "" {
		sp.Currency = "COP"
	}
	if err := h.DB.TT(uc.ClientID, "service_prices").Create(&sp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating price"})
		return
	}
	c.JSON(http.StatusCreated, sp)
}

func (h *ServicePriceHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateServicePriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Price != nil {
		updates["price"] = *req.Price
	}
	if req.Currency != nil {
		updates["currency"] = *req.Currency
	}
	result := h.DB.TT(uc.ClientID, "service_prices").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating price"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "price not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "price updated"})
}

func (h *ServicePriceHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "service_prices").Where("id = ?", c.Param("id")).Delete(&domain.ServicePrice{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting price"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "price not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "price deleted"})
}
