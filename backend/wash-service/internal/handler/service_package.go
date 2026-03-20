package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ServicePackageHandler struct{ DB *repository.DBAdapter }

func NewServicePackageHandler(db *repository.DBAdapter) *ServicePackageHandler {
	return &ServicePackageHandler{DB: db}
}

func (h *ServicePackageHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var pkgs []domain.ServicePackage
	if err := h.DB.TT(uc.ClientID, "service_packages").Find(&pkgs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading packages"})
		return
	}
	c.JSON(http.StatusOK, pkgs)
}

func (h *ServicePackageHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name               string   `json:"name" binding:"required"`
		Description        string   `json:"description"`
		DiscountPercentage *float64 `json:"discount_percentage"`
		ServiceIDs         []string `json:"service_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	pkg := domain.ServicePackage{
		ClientID:    uc.ClientID,
		Name:        req.Name,
		Description: req.Description,
	}
	if req.DiscountPercentage != nil {
		pkg.DiscountPercentage = *req.DiscountPercentage
	}
	tx := h.DB.TT(uc.ClientID, "service_packages").Begin()
	if err := tx.Create(&pkg).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating package"})
		return
	}
	for _, sid := range req.ServiceIDs {
		item := domain.ServicePackageItem{PackageID: pkg.ID, WashServiceID: sid}
		if err := tx.Table("service_package_items").Create(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error adding service to package"})
			return
		}
	}
	tx.Commit()
	c.JSON(http.StatusCreated, pkg)
}

func (h *ServicePackageHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name               *string  `json:"name"`
		Description        *string  `json:"description"`
		DiscountPercentage *float64 `json:"discount_percentage"`
		Activo             *bool    `json:"activo"`
	}
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
	if req.DiscountPercentage != nil {
		updates["discount_percentage"] = *req.DiscountPercentage
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}
	result := h.DB.TT(uc.ClientID, "service_packages").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating package"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "package not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "package updated"})
}

func (h *ServicePackageHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "service_packages").Where("id = ?", c.Param("id")).Delete(&domain.ServicePackage{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting package"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "package not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "package deleted"})
}
