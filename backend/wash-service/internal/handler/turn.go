package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type TurnHandler struct {
	DB *repository.DBAdapter
}

func NewTurnHandler(db *repository.DBAdapter) *TurnHandler {
	return &TurnHandler{DB: db}
}

func (h *TurnHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateTurnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Get next daily number
	var maxNumber int
	h.DB.TT(uc.ClientID, "turns").
		Where("DATE(created_at) = DATE(NOW())").
		Select("COALESCE(MAX(daily_number), 0)").
		Scan(&maxNumber)

	turn := domain.Turn{
		ClientID:           uc.ClientID,
		DailyNumber:        maxNumber + 1,
		Plate:              req.Plate,
		VehicleCategoryID:  req.VehicleCategoryID,
		CustomerID:         req.CustomerID,
		AssignedEmployeeID: req.AssignedEmployeeID,
		Observations:       req.Observations,
		Status:             "WAITING",
	}
	if req.Priority != nil {
		turn.Priority = *req.Priority
	}

	if err := h.DB.TT(uc.ClientID, "turns").Create(&turn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating turn"})
		return
	}

	// Add services if provided
	var totalPrice float64
	for _, svcID := range req.Services {
		var price float64
		h.DB.TT(uc.ClientID, "service_prices").
			Where("wash_service_id = ? AND vehicle_category_id = ?", svcID, req.VehicleCategoryID).
			Select("price").Scan(&price)

		ts := domain.TurnService{
			TurnID:        turn.ID,
			WashServiceID: svcID,
			Price:         price,
		}
		h.DB.TT(uc.ClientID, "turn_services").Create(&ts)
		totalPrice += price
	}

	if totalPrice > 0 {
		h.DB.TT(uc.ClientID, "turns").Where("id = ?", turn.ID).Update("total_price", totalPrice)
		turn.TotalPrice = totalPrice
	}

	// Record status history
	h.DB.TT(uc.ClientID, "turn_status_histories").Create(&domain.TurnStatusHistory{
		TurnID:    turn.ID,
		ToStatus:  "WAITING",
		ChangedBy: uc.UserID,
	})

	c.JSON(http.StatusCreated, turn)
}

func (h *TurnHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	query := h.DB.TT(uc.ClientID, "turns").Where("deleted_at IS NULL")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if date := c.Query("date"); date != "" {
		query = query.Where("DATE(created_at) = ?", date)
	} else {
		// Default: today
		query = query.Where("DATE(created_at) = DATE(NOW())")
	}

	query = query.Order("priority DESC, daily_number ASC")

	var turns []domain.Turn
	if err := query.Find(&turns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading turns"})
		return
	}
	c.JSON(http.StatusOK, turns)
}

func (h *TurnHandler) GetByID(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var turn domain.Turn
	if err := h.DB.TT(uc.ClientID, "turns").Where("id = ?", c.Param("id")).First(&turn).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "turn not found"})
		return
	}
	c.JSON(http.StatusOK, turn)
}

func (h *TurnHandler) UpdateStatus(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateTurnStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	turnID := c.Param("id")
	var turn domain.Turn
	if err := h.DB.TT(uc.ClientID, "turns").Where("id = ?", turnID).First(&turn).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "turn not found"})
		return
	}

	// Validate state transition
	if !isValidTransition(turn.Status, req.Status) {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid status transition from " + turn.Status + " to " + req.Status})
		return
	}

	updates := map[string]interface{}{"status": req.Status}
	now := time.Now()
	switch req.Status {
	case "IN_PROGRESS":
		updates["started_at"] = now
	case "DONE":
		updates["finished_at"] = now
	case "DELIVERED":
		updates["delivered_at"] = now
	}

	h.DB.TT(uc.ClientID, "turns").Where("id = ?", turnID).Updates(updates)

	// Record status history
	h.DB.TT(uc.ClientID, "turn_status_histories").Create(&domain.TurnStatusHistory{
		TurnID:     turnID,
		FromStatus: turn.Status,
		ToStatus:   req.Status,
		ChangedBy:  uc.UserID,
		Reason:     req.Reason,
	})

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "status updated to " + req.Status})
}

func (h *TurnHandler) Assign(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.AssignTurnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result := h.DB.TT(uc.ClientID, "turns").Where("id = ?", c.Param("id")).Update("assigned_employee_id", req.EmployeeID)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "turn not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "employee assigned"})
}

func (h *TurnHandler) AddService(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.AddTurnServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	turnID := c.Param("id")
	ts := domain.TurnService{
		TurnID:        turnID,
		WashServiceID: req.WashServiceID,
	}
	if req.Price != nil {
		ts.Price = *req.Price
	}

	if err := h.DB.TT(uc.ClientID, "turn_services").Create(&ts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error adding service"})
		return
	}

	// Recalculate total
	var total float64
	h.DB.TT(uc.ClientID, "turn_services").Where("turn_id = ?", turnID).Select("COALESCE(SUM(price), 0)").Scan(&total)
	h.DB.TT(uc.ClientID, "turns").Where("id = ?", turnID).Update("total_price", total)

	c.JSON(http.StatusCreated, ts)
}

func (h *TurnHandler) GetStatusHistory(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var history []domain.TurnStatusHistory
	if err := h.DB.TT(uc.ClientID, "turn_status_histories").
		Where("turn_id = ?", c.Param("id")).
		Order("created_at ASC").
		Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading history"})
		return
	}
	c.JSON(http.StatusOK, history)
}

// PublicTurnStatus allows a customer to check their turn status without auth.
func (h *TurnHandler) PublicTurnStatus(c *gin.Context) {
	turnID := c.Param("turn_id")
	// Try all schemas - in production, include client_id in the URL
	clientID := c.Query("client_id")
	if clientID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "client_id query parameter required"})
		return
	}

	var turn domain.Turn
	if err := h.DB.TT(clientID, "turns").Where("id = ?", turnID).First(&turn).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "turn not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":            turn.ID,
		"daily_number":  turn.DailyNumber,
		"plate":         turn.Plate,
		"status":        turn.Status,
		"started_at":    turn.StartedAt,
		"finished_at":   turn.FinishedAt,
		"delivered_at":  turn.DeliveredAt,
	})
}

// Display returns active turns for the TV display.
func (h *TurnHandler) Display(c *gin.Context) {
	clientID := c.Param("client_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	offset := (page - 1) * pageSize

	var turns []domain.Turn
	h.DB.TT(clientID, "turns").
		Where("DATE(created_at) = DATE(NOW())").
		Where("status IN ?", []string{"WAITING", "IN_PROGRESS", "DONE"}).
		Order("CASE status WHEN 'IN_PROGRESS' THEN 0 WHEN 'WAITING' THEN 1 WHEN 'DONE' THEN 2 END, priority DESC, daily_number ASC").
		Offset(offset).Limit(pageSize).
		Find(&turns)

	c.JSON(http.StatusOK, turns)
}

// MyTurns returns turns assigned to the authenticated employee/user.
func (h *TurnHandler) MyTurns(c *gin.Context) {
	uc := middleware.GetUserContext(c)

	// Find employee by user_id
	var employeeID string
	h.DB.TT(uc.ClientID, "employees").Where("user_id = ?", uc.UserID).Select("id").Scan(&employeeID)
	if employeeID == "" {
		c.JSON(http.StatusOK, []domain.Turn{})
		return
	}

	var turns []domain.Turn
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_employee_id = ? AND DATE(created_at) = DATE(NOW())", employeeID).
		Where("status IN ?", []string{"WAITING", "IN_PROGRESS", "PAUSED"}).
		Order("priority DESC, daily_number ASC").
		Find(&turns)

	c.JSON(http.StatusOK, turns)
}

func isValidTransition(from, to string) bool {
	transitions := map[string][]string{
		"WAITING":     {"IN_PROGRESS", "CANCELLED"},
		"IN_PROGRESS": {"DONE", "PAUSED", "CANCELLED"},
		"PAUSED":      {"IN_PROGRESS", "CANCELLED"},
		"DONE":        {"DELIVERED"},
		"DELIVERED":   {},
		"CANCELLED":   {},
	}
	for _, valid := range transitions[from] {
		if valid == to {
			return true
		}
	}
	return false
}
