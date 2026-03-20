package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type SupplierHandler struct{ DB *repository.DBAdapter }

func NewSupplierHandler(db *repository.DBAdapter) *SupplierHandler {
	return &SupplierHandler{DB: db}
}

func (h *SupplierHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var suppliers []domain.Supplier
	if err := h.DB.TT(uc.ClientID, "suppliers").Order("name ASC").Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading suppliers"})
		return
	}
	c.JSON(http.StatusOK, suppliers)
}

func (h *SupplierHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name         string `json:"name" binding:"required"`
		NIT          string `json:"nit"`
		ContactName  string `json:"contact_name"`
		Phone        string `json:"phone"`
		Email        string `json:"email"`
		PaymentTerms string `json:"payment_terms"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	supplier := domain.Supplier{
		ClientID:     uc.ClientID,
		Name:         req.Name,
		NIT:          req.NIT,
		ContactName:  req.ContactName,
		Phone:        req.Phone,
		Email:        req.Email,
		PaymentTerms: req.PaymentTerms,
	}
	if err := h.DB.TT(uc.ClientID, "suppliers").Create(&supplier).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating supplier"})
		return
	}
	c.JSON(http.StatusCreated, supplier)
}

func (h *SupplierHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name         *string `json:"name"`
		NIT          *string `json:"nit"`
		ContactName  *string `json:"contact_name"`
		Phone        *string `json:"phone"`
		Email        *string `json:"email"`
		PaymentTerms *string `json:"payment_terms"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.NIT != nil { updates["nit"] = *req.NIT }
	if req.ContactName != nil { updates["contact_name"] = *req.ContactName }
	if req.Phone != nil { updates["phone"] = *req.Phone }
	if req.Email != nil { updates["email"] = *req.Email }
	if req.PaymentTerms != nil { updates["payment_terms"] = *req.PaymentTerms }
	result := h.DB.TT(uc.ClientID, "suppliers").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supplier not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supplier updated"})
}

func (h *SupplierHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "suppliers").Where("id = ?", c.Param("id")).Delete(&domain.Supplier{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supplier not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supplier deleted"})
}
