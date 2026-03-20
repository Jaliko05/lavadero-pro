package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type WashConfigHandler struct{ DB *repository.DBAdapter }

func NewWashConfigHandler(db *repository.DBAdapter) *WashConfigHandler {
	return &WashConfigHandler{DB: db}
}

// --- Config ---

func (h *WashConfigHandler) GetConfig(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var config domain.WashConfig
	if err := h.DB.TT(uc.ClientID, "wash_configs").First(&config).Error; err != nil {
		c.JSON(http.StatusOK, domain.WashConfig{ClientID: uc.ClientID, Currency: "COP", Timezone: "America/Bogota"})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *WashConfigHandler) UpdateConfig(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		BusinessName  *string  `json:"business_name"`
		LogoURL       *string  `json:"logo_url"`
		NIT           *string  `json:"nit"`
		TaxRegime     *string  `json:"tax_regime"`
		Address       *string  `json:"address"`
		Phones        *string  `json:"phones"`
		Email         *string  `json:"email"`
		Schedule      *string  `json:"schedule"`
		City          *string  `json:"city"`
		Currency      *string  `json:"currency"`
		Timezone      *string  `json:"timezone"`
		SMLMVValue    *float64 `json:"smlmv_value"`
		Holidays      *string  `json:"holidays"`
		MultiLocation *bool    `json:"multi_location"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var existing domain.WashConfig
	err := h.DB.TT(uc.ClientID, "wash_configs").First(&existing).Error

	updates := make(map[string]interface{})
	if req.BusinessName != nil { updates["business_name"] = *req.BusinessName }
	if req.LogoURL != nil { updates["logo_url"] = *req.LogoURL }
	if req.NIT != nil { updates["nit"] = *req.NIT }
	if req.TaxRegime != nil { updates["tax_regime"] = *req.TaxRegime }
	if req.Address != nil { updates["address"] = *req.Address }
	if req.Phones != nil { updates["phones"] = *req.Phones }
	if req.Email != nil { updates["email"] = *req.Email }
	if req.Schedule != nil { updates["schedule"] = *req.Schedule }
	if req.City != nil { updates["city"] = *req.City }
	if req.Currency != nil { updates["currency"] = *req.Currency }
	if req.Timezone != nil { updates["timezone"] = *req.Timezone }
	if req.SMLMVValue != nil { updates["smlmv_value"] = *req.SMLMVValue }
	if req.Holidays != nil { updates["holidays"] = *req.Holidays }
	if req.MultiLocation != nil { updates["multi_location"] = *req.MultiLocation }

	if err != nil {
		// Create new config
		config := domain.WashConfig{ClientID: uc.ClientID, Currency: "COP", Timezone: "America/Bogota"}
		h.DB.TT(uc.ClientID, "wash_configs").Create(&config)
		h.DB.TT(uc.ClientID, "wash_configs").Where("id = ?", config.ID).Updates(updates)
		c.JSON(http.StatusCreated, dto.MessageResponse{Message: "config created"})
		return
	}

	h.DB.TT(uc.ClientID, "wash_configs").Where("id = ?", existing.ID).Updates(updates)
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "config updated"})
}

// --- Locations ---

func (h *WashConfigHandler) ListLocations(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var locations []domain.Location
	if err := h.DB.TT(uc.ClientID, "locations").Order("name ASC").Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading locations"})
		return
	}
	c.JSON(http.StatusOK, locations)
}

func (h *WashConfigHandler) CreateLocation(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name    string `json:"name" binding:"required"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	loc := domain.Location{
		ClientID: uc.ClientID,
		Name:     req.Name,
		Address:  req.Address,
		Phone:    req.Phone,
		Active:   true,
	}
	if err := h.DB.TT(uc.ClientID, "locations").Create(&loc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating location"})
		return
	}
	c.JSON(http.StatusCreated, loc)
}

func (h *WashConfigHandler) UpdateLocation(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name    *string `json:"name"`
		Address *string `json:"address"`
		Phone   *string `json:"phone"`
		Active  *bool   `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Address != nil { updates["address"] = *req.Address }
	if req.Phone != nil { updates["phone"] = *req.Phone }
	if req.Active != nil { updates["active"] = *req.Active }
	result := h.DB.TT(uc.ClientID, "locations").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "location not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "location updated"})
}

func (h *WashConfigHandler) DeleteLocation(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "locations").Where("id = ?", c.Param("id")).Delete(&domain.Location{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "location not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "location deleted"})
}

// --- Notification Templates ---

func (h *WashConfigHandler) ListNotificationTemplates(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var templates []domain.NotificationTemplate
	if err := h.DB.TT(uc.ClientID, "notification_templates").Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading templates"})
		return
	}
	c.JSON(http.StatusOK, templates)
}

func (h *WashConfigHandler) CreateNotificationTemplate(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		TriggerEvent    string `json:"trigger_event" binding:"required"`
		MessageTemplate string `json:"message_template" binding:"required"`
		Channel         string `json:"channel" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	tmpl := domain.NotificationTemplate{
		ClientID:        uc.ClientID,
		TriggerEvent:    req.TriggerEvent,
		MessageTemplate: req.MessageTemplate,
		Channel:         req.Channel,
		Active:          true,
	}
	if err := h.DB.TT(uc.ClientID, "notification_templates").Create(&tmpl).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating template"})
		return
	}
	c.JSON(http.StatusCreated, tmpl)
}

func (h *WashConfigHandler) UpdateNotificationTemplate(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		TriggerEvent    *string `json:"trigger_event"`
		MessageTemplate *string `json:"message_template"`
		Channel         *string `json:"channel"`
		Active          *bool   `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.TriggerEvent != nil { updates["trigger_event"] = *req.TriggerEvent }
	if req.MessageTemplate != nil { updates["message_template"] = *req.MessageTemplate }
	if req.Channel != nil { updates["channel"] = *req.Channel }
	if req.Active != nil { updates["active"] = *req.Active }
	result := h.DB.TT(uc.ClientID, "notification_templates").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "template not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "template updated"})
}

func (h *WashConfigHandler) DeleteNotificationTemplate(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "notification_templates").Where("id = ?", c.Param("id")).Delete(&domain.NotificationTemplate{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "template not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "template deleted"})
}
