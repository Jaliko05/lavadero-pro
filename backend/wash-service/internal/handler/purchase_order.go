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

type PurchaseOrderHandler struct{ DB *repository.DBAdapter }

func NewPurchaseOrderHandler(db *repository.DBAdapter) *PurchaseOrderHandler {
	return &PurchaseOrderHandler{DB: db}
}

func (h *PurchaseOrderHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var orders []domain.PurchaseOrder
	q := h.DB.TT(uc.ClientID, "purchase_orders")
	if sid := c.Query("supplier_id"); sid != "" {
		q = q.Where("supplier_id = ?", sid)
	}
	if err := q.Order("date DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading purchase orders"})
		return
	}
	c.JSON(http.StatusOK, orders)
}

func (h *PurchaseOrderHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		SupplierID    string  `json:"supplier_id" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"`
		ReceiptURL    *string `json:"receipt_url"`
		Items         []struct {
			ItemType  string  `json:"item_type" binding:"required"`
			ItemID    string  `json:"item_id" binding:"required"`
			Quantity  float64 `json:"quantity" binding:"required"`
			UnitPrice float64 `json:"unit_price" binding:"required"`
		} `json:"items" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var total float64
	for _, item := range req.Items {
		total += item.Quantity * item.UnitPrice
	}

	var receiptURL string
	if req.ReceiptURL != nil {
		receiptURL = *req.ReceiptURL
	}
	po := domain.PurchaseOrder{
		ClientID:      uc.ClientID,
		SupplierID:    req.SupplierID,
		Total:         total,
		PaymentMethod: req.PaymentMethod,
		ReceiptURL:    receiptURL,
		Date:          time.Now(),
	}

	tx := h.DB.TT(uc.ClientID, "purchase_orders").Begin()
	if err := tx.Create(&po).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating purchase order"})
		return
	}

	for _, item := range req.Items {
		poi := domain.PurchaseOrderItem{
			PurchaseOrderID: po.ID,
			ItemType:        item.ItemType,
			ItemID:          item.ItemID,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
		}
		tx.Table("purchase_order_items").Create(&poi)

		// Update stock
		if item.ItemType == "product" {
			tx.Table("products").Where("id = ?", item.ItemID).
				UpdateColumn("stock", repository.RawExpr("stock + ?", item.Quantity))
		} else if item.ItemType == "supply" {
			tx.Table("wash_supplies").Where("id = ?", item.ItemID).
				UpdateColumn("stock", repository.RawExpr("stock + ?", item.Quantity))
		}

		// Register inventory movement
		mov := domain.InventoryMovement{
			ClientID:     uc.ClientID,
			ItemType:     item.ItemType,
			ItemID:       item.ItemID,
			MovementType: "purchase",
			Quantity:     item.Quantity,
			Reference:    po.ID,
			Date:         time.Now(),
		}
		tx.Table("inventory_movements").Create(&mov)
	}

	// Register expense
	exp := domain.Expense{
		ClientID:      uc.ClientID,
		Category:      "compra_inventario",
		Description:   "Orden de compra",
		Amount:        total,
		PaymentMethod: req.PaymentMethod,
		SupplierID:    &req.SupplierID,
		ReceiptURL:    receiptURL,
		RegisteredBy:  uc.UserID,
		Date:          time.Now(),
	}
	tx.Table("expenses").Create(&exp)

	tx.Commit()
	c.JSON(http.StatusCreated, po)
}

func (h *PurchaseOrderHandler) Get(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var po domain.PurchaseOrder
	if err := h.DB.TT(uc.ClientID, "purchase_orders").Where("id = ?", c.Param("id")).First(&po).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "purchase order not found"})
		return
	}
	var items []domain.PurchaseOrderItem
	h.DB.TT(uc.ClientID, "purchase_order_items").Where("purchase_order_id = ?", po.ID).Find(&items)
	c.JSON(http.StatusOK, gin.H{"purchase_order": po, "items": items})
}

func (h *PurchaseOrderHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "purchase_orders").Where("id = ?", c.Param("id")).Delete(&domain.PurchaseOrder{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "purchase order not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "purchase order deleted"})
}
