package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type SupplyHandler struct{ DB *repository.DBAdapter }

func NewSupplyHandler(db *repository.DBAdapter) *SupplyHandler {
	return &SupplyHandler{DB: db}
}

// --- Wash Supplies ---

func (h *SupplyHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var supplies []domain.WashSupply
	if err := h.DB.TT(uc.ClientID, "wash_supplies").Order("name ASC").Find(&supplies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading supplies"})
		return
	}
	c.JSON(http.StatusOK, supplies)
}

func (h *SupplyHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name           string  `json:"name" binding:"required"`
		Unit           string  `json:"unit" binding:"required"`
		Stock          float64 `json:"stock"`
		MinStock       float64 `json:"min_stock"`
		EmergencyStock float64 `json:"emergency_stock"`
		CostPerUnit    float64 `json:"cost_per_unit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	supply := domain.WashSupply{
		ClientID:       uc.ClientID,
		Name:           req.Name,
		Unit:           req.Unit,
		Stock:          req.Stock,
		MinStock:       req.MinStock,
		EmergencyStock: req.EmergencyStock,
		CostPerUnit:    req.CostPerUnit,
	}
	if err := h.DB.TT(uc.ClientID, "wash_supplies").Create(&supply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating supply"})
		return
	}
	c.JSON(http.StatusCreated, supply)
}

func (h *SupplyHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name           *string  `json:"name"`
		Unit           *string  `json:"unit"`
		Stock          *float64 `json:"stock"`
		MinStock       *float64 `json:"min_stock"`
		EmergencyStock *float64 `json:"emergency_stock"`
		CostPerUnit    *float64 `json:"cost_per_unit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Unit != nil { updates["unit"] = *req.Unit }
	if req.Stock != nil { updates["stock"] = *req.Stock }
	if req.MinStock != nil { updates["min_stock"] = *req.MinStock }
	if req.EmergencyStock != nil { updates["emergency_stock"] = *req.EmergencyStock }
	if req.CostPerUnit != nil { updates["cost_per_unit"] = *req.CostPerUnit }
	result := h.DB.TT(uc.ClientID, "wash_supplies").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supply not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supply updated"})
}

func (h *SupplyHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "wash_supplies").Where("id = ?", c.Param("id")).Delete(&domain.WashSupply{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supply not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supply deleted"})
}

// --- Supply Consumptions ---

func (h *SupplyHandler) ListConsumptions(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var items []domain.SupplyConsumption
	q := h.DB.TT(uc.ClientID, "supply_consumptions")
	if sid := c.Query("wash_service_id"); sid != "" {
		q = q.Where("wash_service_id = ?", sid)
	}
	if err := q.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading supply consumptions"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *SupplyHandler) CreateConsumption(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		WashServiceID string  `json:"wash_service_id" binding:"required"`
		WashSupplyID  string  `json:"wash_supply_id" binding:"required"`
		QuantityPerService float64 `json:"quantity_per_service" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	sc := domain.SupplyConsumption{
		ClientID:           uc.ClientID,
		WashServiceID:      req.WashServiceID,
		WashSupplyID:       req.WashSupplyID,
		QuantityPerService: req.QuantityPerService,
	}
	if err := h.DB.TT(uc.ClientID, "supply_consumptions").Create(&sc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating supply consumption"})
		return
	}
	c.JSON(http.StatusCreated, sc)
}

func (h *SupplyHandler) UpdateConsumption(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		QuantityPerService *float64 `json:"quantity_per_service"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.QuantityPerService != nil { updates["quantity_per_service"] = *req.QuantityPerService }
	result := h.DB.TT(uc.ClientID, "supply_consumptions").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supply consumption not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supply consumption updated"})
}

func (h *SupplyHandler) DeleteConsumption(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "supply_consumptions").Where("id = ?", c.Param("id")).Delete(&domain.SupplyConsumption{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "supply consumption not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "supply consumption deleted"})
}
