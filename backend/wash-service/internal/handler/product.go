package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ProductHandler struct{ DB *repository.DBAdapter }

func NewProductHandler(db *repository.DBAdapter) *ProductHandler {
	return &ProductHandler{DB: db}
}

func (h *ProductHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var products []domain.Product
	q := h.DB.TT(uc.ClientID, "products")
	if cat := c.Query("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if err := q.Order("name ASC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading products"})
		return
	}
	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	p := domain.Product{
		ClientID:  uc.ClientID,
		Name:      req.Name,
		Code:      req.Code,
		Barcode:   req.Barcode,
		Category:  req.Category,
		SalePrice: req.SalePrice,
		ImageURL:  req.ImageURL,
	}
	if req.CostPrice != nil { p.CostPrice = *req.CostPrice }
	if req.Stock != nil { p.Stock = *req.Stock }
	if req.MinStock != nil { p.MinStock = *req.MinStock }
	if req.IVARate != nil { p.IVARate = *req.IVARate }

	if err := h.DB.TT(uc.ClientID, "products").Create(&p).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating product"})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *ProductHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Code != nil { updates["code"] = *req.Code }
	if req.Barcode != nil { updates["barcode"] = *req.Barcode }
	if req.Category != nil { updates["category"] = *req.Category }
	if req.SalePrice != nil { updates["sale_price"] = *req.SalePrice }
	if req.CostPrice != nil { updates["cost_price"] = *req.CostPrice }
	if req.Stock != nil { updates["stock"] = *req.Stock }
	if req.MinStock != nil { updates["min_stock"] = *req.MinStock }
	if req.IVARate != nil { updates["iva_rate"] = *req.IVARate }
	if req.Status != nil { updates["status"] = *req.Status }
	if req.ImageURL != nil { updates["image_url"] = *req.ImageURL }

	result := h.DB.TT(uc.ClientID, "products").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating product"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "product not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "product updated"})
}

func (h *ProductHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "products").Where("id = ?", c.Param("id")).Delete(&domain.Product{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting product"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "product not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "product deleted"})
}
