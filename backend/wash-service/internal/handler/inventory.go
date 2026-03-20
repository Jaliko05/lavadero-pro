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

type InventoryHandler struct{ DB *repository.DBAdapter }

func NewInventoryHandler(db *repository.DBAdapter) *InventoryHandler {
	return &InventoryHandler{DB: db}
}

func (h *InventoryHandler) Alerts(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	type AlertItem struct {
		ID       string  `json:"id"`
		Name     string  `json:"name"`
		Type     string  `json:"type"`
		Stock    float64 `json:"stock"`
		MinStock float64 `json:"min_stock"`
		Level    string  `json:"level"`
	}

	var alerts []AlertItem

	// Products below min stock
	var products []domain.Product
	h.DB.TT(uc.ClientID, "products").Where("stock <= min_stock AND status = ?", "activo").Find(&products)
	for _, p := range products {
		alerts = append(alerts, AlertItem{
			ID: p.ID, Name: p.Name, Type: "product",
			Stock: float64(p.Stock), MinStock: float64(p.MinStock), Level: "warning",
		})
	}

	// Supplies below min stock
	var supplies []domain.WashSupply
	h.DB.TT(uc.ClientID, "wash_supplies").Where("stock <= min_stock").Find(&supplies)
	for _, s := range supplies {
		level := "warning"
		if s.Stock <= s.EmergencyStock {
			level = "critical"
		}
		alerts = append(alerts, AlertItem{
			ID: s.ID, Name: s.Name, Type: "supply",
			Stock: s.Stock, MinStock: s.MinStock, Level: level,
		})
	}

	c.JSON(http.StatusOK, alerts)
}

func (h *InventoryHandler) Count(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Items []struct {
			ItemType string  `json:"item_type" binding:"required"`
			ItemID   string  `json:"item_id" binding:"required"`
			Counted  float64 `json:"counted" binding:"required"`
		} `json:"items" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	tx := h.DB.TT(uc.ClientID, "inventory_movements").Begin()
	for _, item := range req.Items {
		// Get current stock
		var currentStock float64
		if item.ItemType == "product" {
			var p domain.Product
			h.DB.TT(uc.ClientID, "products").Where("id = ?", item.ItemID).First(&p)
			currentStock = float64(p.Stock)
			tx.Table("products").Where("id = ?", item.ItemID).Update("stock", int(item.Counted))
		} else if item.ItemType == "supply" {
			var s domain.WashSupply
			h.DB.TT(uc.ClientID, "wash_supplies").Where("id = ?", item.ItemID).First(&s)
			currentStock = s.Stock
			tx.Table("wash_supplies").Where("id = ?", item.ItemID).Update("stock", item.Counted)
		}

		diff := item.Counted - currentStock
		mov := domain.InventoryMovement{
			ClientID:     uc.ClientID,
			ItemType:     item.ItemType,
			ItemID:       item.ItemID,
			MovementType: "adjustment",
			Quantity:     diff,
			BalanceAfter: item.Counted,
			Reference:    "conteo_fisico",
			Date:         time.Now(),
		}
		tx.Create(&mov)
	}
	tx.Commit()

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "inventory count recorded"})
}
