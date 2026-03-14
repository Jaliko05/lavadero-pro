package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type WashServiceHandler struct {
	DB *repository.DBAdapter
}

func NewWashServiceHandler(db *repository.DBAdapter) *WashServiceHandler {
	return &WashServiceHandler{DB: db}
}

func (h *WashServiceHandler) ListPublic(c *gin.Context) {
	clientID := middleware.GetClientID(c)
	if clientID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "X-Client-ID header required"})
		return
	}

	var services []domain.WashService
	if err := h.DB.TT(clientID, "wash_services").Where("status = ?", "activo").Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading services"})
		return
	}
	c.JSON(http.StatusOK, services)
}

func (h *WashServiceHandler) AdminList(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var services []domain.WashService
	if err := h.DB.TT(uc.ClientID, "wash_services").Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading services"})
		return
	}
	c.JSON(http.StatusOK, services)
}

func (h *WashServiceHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateWashServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	svc := domain.WashService{
		ClientID:    uc.ClientID,
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		ImageURL:    req.ImageURL,
	}
	if req.EstimatedTimeMinutes != nil {
		svc.EstimatedTimeMinutes = *req.EstimatedTimeMinutes
	}

	if err := h.DB.TT(uc.ClientID, "wash_services").Create(&svc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating service"})
		return
	}
	c.JSON(http.StatusCreated, svc)
}

func (h *WashServiceHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateWashServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.EstimatedTimeMinutes != nil {
		updates["estimated_time_minutes"] = *req.EstimatedTimeMinutes
	}
	if req.ImageURL != nil {
		updates["image_url"] = *req.ImageURL
	}

	result := h.DB.TT(uc.ClientID, "wash_services").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating service"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "service not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "service updated"})
}

func (h *WashServiceHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "wash_services").Where("id = ?", c.Param("id")).Delete(&domain.WashService{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting service"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "service not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "service deleted"})
}
