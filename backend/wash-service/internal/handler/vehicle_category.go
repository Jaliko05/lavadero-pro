package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type VehicleCategoryHandler struct {
	DB *repository.DBAdapter
}

func NewVehicleCategoryHandler(db *repository.DBAdapter) *VehicleCategoryHandler {
	return &VehicleCategoryHandler{DB: db}
}

func (h *VehicleCategoryHandler) List(c *gin.Context) {
	clientID := middleware.GetClientID(c)
	if clientID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "X-Client-ID header required"})
		return
	}

	var categories []domain.VehicleCategory
	if err := h.DB.TT(clientID, "vehicle_categories").Where("activo = ?", true).Order("orden ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (h *VehicleCategoryHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateVehicleCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	cat := domain.VehicleCategory{
		ClientID: uc.ClientID,
		Name:     req.Name,
		Icon:     req.Icon,
		ParentID: req.ParentID,
	}
	if req.Orden != nil {
		cat.Orden = *req.Orden
	}

	if err := h.DB.TT(uc.ClientID, "vehicle_categories").Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating category"})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

func (h *VehicleCategoryHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateVehicleCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Icon != nil {
		updates["icon"] = *req.Icon
	}
	if req.ParentID != nil {
		updates["parent_id"] = *req.ParentID
	}
	if req.Orden != nil {
		updates["orden"] = *req.Orden
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}

	result := h.DB.TT(uc.ClientID, "vehicle_categories").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating category"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "category not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "category updated"})
}

func (h *VehicleCategoryHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "vehicle_categories").Where("id = ?", c.Param("id")).Delete(&domain.VehicleCategory{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting category"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "category not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "category deleted"})
}
