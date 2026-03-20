package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type CustomerHandler struct{ DB *repository.DBAdapter }

func NewCustomerHandler(db *repository.DBAdapter) *CustomerHandler {
	return &CustomerHandler{DB: db}
}

// --- Search (authenticated, non-admin) ---

func (h *CustomerHandler) Search(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "query parameter q is required"})
		return
	}
	var customers []domain.CustomerProfile
	like := "%" + q + "%"
	h.DB.TT(uc.ClientID, "customer_profiles").
		Where("name ILIKE ? OR phone ILIKE ? OR document ILIKE ?", like, like, like).
		Limit(20).Find(&customers)

	// Also search by plate
	var vehicles []domain.CustomerVehicle
	h.DB.TT(uc.ClientID, "customer_vehicles").Where("plate ILIKE ?", like).Limit(20).Find(&vehicles)
	if len(vehicles) > 0 {
		var customerIDs []string
		for _, v := range vehicles {
			customerIDs = append(customerIDs, v.CustomerID)
		}
		var plateCustomers []domain.CustomerProfile
		h.DB.TT(uc.ClientID, "customer_profiles").Where("id IN ?", customerIDs).Find(&plateCustomers)
		customers = append(customers, plateCustomers...)
	}

	c.JSON(http.StatusOK, customers)
}

func (h *CustomerHandler) History(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	customerID := c.Param("id")

	// Get vehicles
	var vehicles []domain.CustomerVehicle
	h.DB.TT(uc.ClientID, "customer_vehicles").Where("customer_id = ?", customerID).Find(&vehicles)

	// Get turns for this customer
	var turns []domain.Turn
	h.DB.TT(uc.ClientID, "turns").Where("customer_id = ?", customerID).Order("created_at DESC").Limit(50).Find(&turns)

	// Loyalty balance
	var earned, redeemed int
	h.DB.TT(uc.ClientID, "loyalty_transactions").Where("customer_id = ? AND type = ?", customerID, "earn").Select("COALESCE(SUM(points),0)").Row().Scan(&earned)
	h.DB.TT(uc.ClientID, "loyalty_transactions").Where("customer_id = ? AND type IN ?", customerID, []string{"redeem", "expire"}).Select("COALESCE(SUM(points),0)").Row().Scan(&redeemed)

	c.JSON(http.StatusOK, gin.H{
		"vehicles":       vehicles,
		"turns":          turns,
		"loyalty_balance": earned - redeemed,
	})
}

// --- Admin CRUD ---

func (h *CustomerHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var customers []domain.CustomerProfile
	q := h.DB.TT(uc.ClientID, "customer_profiles")
	if t := c.Query("type"); t != "" {
		q = q.Where("type = ?", t)
	}
	if err := q.Order("name ASC").Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading customers"})
		return
	}
	c.JSON(http.StatusOK, customers)
}

func (h *CustomerHandler) Get(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var customer domain.CustomerProfile
	if err := h.DB.TT(uc.ClientID, "customer_profiles").Where("id = ?", c.Param("id")).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "customer not found"})
		return
	}
	c.JSON(http.StatusOK, customer)
}

func (h *CustomerHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name              string  `json:"name" binding:"required"`
		Document          string  `json:"document"`
		Phone             string  `json:"phone"`
		Email             string  `json:"email"`
		Type              string  `json:"type"`
		PreferredDiscount *float64 `json:"preferred_discount"`
		CreditApproved    bool    `json:"credit_approved"`
		CreditLimit       float64 `json:"credit_limit"`
		Notes             string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	var discount float64
	if req.PreferredDiscount != nil {
		discount = *req.PreferredDiscount
	}
	customer := domain.CustomerProfile{
		ClientID:          uc.ClientID,
		Name:              req.Name,
		Document:          req.Document,
		Phone:             req.Phone,
		Email:             req.Email,
		Type:              req.Type,
		PreferredDiscount: discount,
		CreditApproved:    req.CreditApproved,
		CreditLimit:       req.CreditLimit,
		Notes:             req.Notes,
	}
	if customer.Type == "" {
		customer.Type = "natural"
	}
	if err := h.DB.TT(uc.ClientID, "customer_profiles").Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating customer"})
		return
	}
	c.JSON(http.StatusCreated, customer)
}

func (h *CustomerHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name              *string  `json:"name"`
		Document          *string  `json:"document"`
		Phone             *string  `json:"phone"`
		Email             *string  `json:"email"`
		Type              *string  `json:"type"`
		PreferredDiscount *float64 `json:"preferred_discount"`
		CreditApproved    *bool    `json:"credit_approved"`
		CreditLimit       *float64 `json:"credit_limit"`
		Notes             *string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Document != nil { updates["document"] = *req.Document }
	if req.Phone != nil { updates["phone"] = *req.Phone }
	if req.Email != nil { updates["email"] = *req.Email }
	if req.Type != nil { updates["type"] = *req.Type }
	if req.PreferredDiscount != nil { updates["preferred_discount"] = *req.PreferredDiscount }
	if req.CreditApproved != nil { updates["credit_approved"] = *req.CreditApproved }
	if req.CreditLimit != nil { updates["credit_limit"] = *req.CreditLimit }
	if req.Notes != nil { updates["notes"] = *req.Notes }
	result := h.DB.TT(uc.ClientID, "customer_profiles").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "customer not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "customer updated"})
}

func (h *CustomerHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "customer_profiles").Where("id = ?", c.Param("id")).Delete(&domain.CustomerProfile{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "customer not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "customer deleted"})
}

// --- Customer Vehicles ---

func (h *CustomerHandler) ListVehicles(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var vehicles []domain.CustomerVehicle
	q := h.DB.TT(uc.ClientID, "customer_vehicles")
	if cid := c.Query("customer_id"); cid != "" {
		q = q.Where("customer_id = ?", cid)
	}
	if err := q.Find(&vehicles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading vehicles"})
		return
	}
	c.JSON(http.StatusOK, vehicles)
}

func (h *CustomerHandler) CreateVehicle(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		CustomerID        string `json:"customer_id" binding:"required"`
		Plate             string `json:"plate" binding:"required"`
		VehicleCategoryID string `json:"vehicle_category_id" binding:"required"`
		Nickname          string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	vehicle := domain.CustomerVehicle{
		CustomerID:        req.CustomerID,
		ClientID:          uc.ClientID,
		Plate:             req.Plate,
		VehicleCategoryID: req.VehicleCategoryID,
		Nickname:          req.Nickname,
	}
	if err := h.DB.TT(uc.ClientID, "customer_vehicles").Create(&vehicle).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating vehicle"})
		return
	}
	c.JSON(http.StatusCreated, vehicle)
}

func (h *CustomerHandler) UpdateVehicle(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Plate             *string `json:"plate"`
		VehicleCategoryID *string `json:"vehicle_category_id"`
		Nickname          *string `json:"nickname"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Plate != nil { updates["plate"] = *req.Plate }
	if req.VehicleCategoryID != nil { updates["vehicle_category_id"] = *req.VehicleCategoryID }
	if req.Nickname != nil { updates["nickname"] = *req.Nickname }
	result := h.DB.TT(uc.ClientID, "customer_vehicles").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "vehicle not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "vehicle updated"})
}

func (h *CustomerHandler) DeleteVehicle(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "customer_vehicles").Where("id = ?", c.Param("id")).Delete(&domain.CustomerVehicle{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "vehicle not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "vehicle deleted"})
}
