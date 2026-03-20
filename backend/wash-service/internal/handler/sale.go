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

type SaleHandler struct{ DB *repository.DBAdapter }

func NewSaleHandler(db *repository.DBAdapter) *SaleHandler {
	return &SaleHandler{DB: db}
}

func (h *SaleHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var subtotal float64
	for _, item := range req.Items {
		subtotal += item.UnitPrice * float64(item.Quantity)
	}
	discount := float64(0)
	if req.Discount != nil { discount = *req.Discount }
	total := subtotal - discount

	sale := domain.Sale{
		ClientID:      uc.ClientID,
		TurnID:        req.TurnID,
		CashierID:     uc.UserID,
		Subtotal:      subtotal,
		Discount:      discount,
		Total:         total,
		PaymentStatus: "pendiente",
		Notes:         req.Notes,
	}

	tx := h.DB.TT(uc.ClientID, "sales").Begin()
	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating sale"})
		return
	}

	for _, item := range req.Items {
		si := domain.SaleItem{
			SaleID:    sale.ID,
			ItemType:  item.ItemType,
			ItemID:    item.ItemID,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
			Subtotal:  item.UnitPrice * float64(item.Quantity),
		}
		if err := tx.Table("sale_items").Create(&si).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating sale item"})
			return
		}
		// Decrement product stock if item_type=product
		if item.ItemType == "product" {
			tx.Table("products").Where("id = ?", item.ItemID).Update("stock", repository.RawExpr("stock - ?", item.Quantity))
		}
	}

	// Register income
	income := domain.Income{
		ClientID:      uc.ClientID,
		Category:      "venta",
		Description:   "Venta #" + sale.ID[:8],
		Amount:        total,
		PaymentMethod: "pendiente",
		SourceType:    "sale",
		SourceID:      &sale.ID,
		RegisteredBy:  uc.UserID,
		Date:          time.Now(),
	}
	tx.Table("incomes").Create(&income)
	tx.Commit()

	c.JSON(http.StatusCreated, sale)
}

func (h *SaleHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var sales []domain.Sale
	q := h.DB.TT(uc.ClientID, "sales")
	if turnID := c.Query("turn_id"); turnID != "" {
		q = q.Where("turn_id = ?", turnID)
	}
	if err := q.Order("created_at DESC").Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading sales"})
		return
	}
	c.JSON(http.StatusOK, sales)
}

func (h *SaleHandler) CreatePayment(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	payment := domain.Payment{
		SaleID:    req.SaleID,
		ClientID:  uc.ClientID,
		Method:    req.Method,
		Amount:    req.Amount,
		Reference: req.Reference,
		Confirmed: req.Method == "efectivo",
	}

	if err := h.DB.TT(uc.ClientID, "payments").Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating payment"})
		return
	}

	// Check if sale is fully paid
	var totalPaid float64
	h.DB.TT(uc.ClientID, "payments").Where("sale_id = ?", req.SaleID).Select("COALESCE(SUM(amount),0)").Row().Scan(&totalPaid)
	var sale domain.Sale
	h.DB.TT(uc.ClientID, "sales").Where("id = ?", req.SaleID).First(&sale)
	if totalPaid >= sale.Total {
		h.DB.TT(uc.ClientID, "sales").Where("id = ?", req.SaleID).Update("payment_status", "pagado")
	}

	c.JSON(http.StatusCreated, payment)
}
