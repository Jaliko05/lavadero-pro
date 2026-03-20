package handler

import (
	"math"
	"net/http"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct{ DB *repository.DBAdapter }

func NewEmployeeHandler(db *repository.DBAdapter) *EmployeeHandler {
	return &EmployeeHandler{DB: db}
}

func (h *EmployeeHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var employees []domain.Employee
	q := h.DB.TT(uc.ClientID, "employees")
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("full_name ASC").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading employees"})
		return
	}
	c.JSON(http.StatusOK, employees)
}

func (h *EmployeeHandler) Get(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var emp domain.Employee
	if err := h.DB.TT(uc.ClientID, "employees").Where("id = ?", c.Param("id")).First(&emp).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "employee not found"})
		return
	}
	c.JSON(http.StatusOK, emp)
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	paymentType := req.PaymentType
	if paymentType == "" {
		paymentType = "fixed_salary"
	}
	emp := domain.Employee{
		ClientID:         uc.ClientID,
		FullName:         req.FullName,
		DocumentType:     req.DocumentType,
		DocumentNumber:   req.DocumentNumber,
		Phone:            req.Phone,
		Address:          req.Address,
		ContractType:     req.ContractType,
		Role:             req.Role,
		BaseSalary:       req.BaseSalary,
		PaymentType:      paymentType,
		AmountPerWash:    req.AmountPerWash,
		PercentageRate:   req.PercentageRate,
		PayFrequency:     req.PayFrequency,
		BankName:         req.BankName,
		BankAccount:      req.BankAccount,
		EPS:              req.EPS,
		AFP:              req.AFP,
		ARL:              req.ARL,
		CajaCompensacion: req.CajaCompensacion,
		PhotoURL:         req.PhotoURL,
		Status:           "activo",
	}
	if err := h.DB.TT(uc.ClientID, "employees").Create(&emp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating employee"})
		return
	}
	c.JSON(http.StatusCreated, emp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.FullName != nil { updates["full_name"] = *req.FullName }
	if req.DocumentType != nil { updates["document_type"] = *req.DocumentType }
	if req.DocumentNumber != nil { updates["document_number"] = *req.DocumentNumber }
	if req.Phone != nil { updates["phone"] = *req.Phone }
	if req.Address != nil { updates["address"] = *req.Address }
	if req.ContractType != nil { updates["contract_type"] = *req.ContractType }
	if req.Role != nil { updates["role"] = *req.Role }
	if req.BaseSalary != nil { updates["base_salary"] = *req.BaseSalary }
	if req.PaymentType != nil { updates["payment_type"] = *req.PaymentType }
	if req.AmountPerWash != nil { updates["amount_per_wash"] = *req.AmountPerWash }
	if req.PercentageRate != nil { updates["percentage_rate"] = *req.PercentageRate }
	if req.PayFrequency != nil { updates["pay_frequency"] = *req.PayFrequency }
	if req.BankName != nil { updates["bank_name"] = *req.BankName }
	if req.BankAccount != nil { updates["bank_account"] = *req.BankAccount }
	if req.EPS != nil { updates["eps"] = *req.EPS }
	if req.AFP != nil { updates["afp"] = *req.AFP }
	if req.ARL != nil { updates["arl"] = *req.ARL }
	if req.CajaCompensacion != nil { updates["caja_compensacion"] = *req.CajaCompensacion }
	if req.Status != nil { updates["status"] = *req.Status }
	if req.PhotoURL != nil { updates["photo_url"] = *req.PhotoURL }

	result := h.DB.TT(uc.ClientID, "employees").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error updating employee"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "employee not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "employee updated"})
}

func (h *EmployeeHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "employees").Where("id = ?", c.Param("id")).Delete(&domain.Employee{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting employee"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "employee not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "employee deleted"})
}

func (h *EmployeeHandler) GetAttendance(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var records []domain.EmployeeAttendance
	q := h.DB.TT(uc.ClientID, "employee_attendances").Where("employee_id = ?", c.Param("id"))
	if from := c.Query("from"); from != "" {
		q = q.Where("date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("date <= ?", to)
	}
	if err := q.Order("date DESC").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading attendance"})
		return
	}
	c.JSON(http.StatusOK, records)
}

func (h *EmployeeHandler) GetPerformance(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	empID := c.Param("id")
	from := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))

	// Total turns completed
	var totalTurns int64
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_to = ? AND status = ? AND created_at >= ? AND created_at <= ?", empID, "DELIVERED", from, to+" 23:59:59").
		Count(&totalTurns)

	// Total revenue generated
	var totalRevenue float64
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_to = ? AND status = ? AND created_at >= ? AND created_at <= ?", empID, "DELIVERED", from, to+" 23:59:59").
		Select("COALESCE(SUM(total_price), 0)").Row().Scan(&totalRevenue)

	// Average time per turn (minutes)
	var avgMinutes float64
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_to = ? AND status = ? AND started_at IS NOT NULL AND finished_at IS NOT NULL AND created_at >= ? AND created_at <= ?",
			empID, "DELIVERED", from, to+" 23:59:59").
		Select("COALESCE(AVG(EXTRACT(EPOCH FROM (finished_at - started_at)) / 60), 0)").Row().Scan(&avgMinutes)

	// Average rating
	var avgRating float64
	h.DB.TT(uc.ClientID, "ratings").
		Where("employee_id = ? AND created_at >= ? AND created_at <= ?", empID, from, to+" 23:59:59").
		Select("COALESCE(AVG(score), 0)").Row().Scan(&avgRating)

	// Attendance stats
	var totalDays, presentDays int64
	h.DB.TT(uc.ClientID, "employee_attendances").
		Where("employee_id = ? AND date >= ? AND date <= ?", empID, from, to).Count(&totalDays)
	h.DB.TT(uc.ClientID, "employee_attendances").
		Where("employee_id = ? AND date >= ? AND date <= ? AND status = ?", empID, from, to, "presente").Count(&presentDays)

	var punctuality float64
	if totalDays > 0 {
		punctuality = math.Round(float64(presentDays) / float64(totalDays) * 100)
	}

	c.JSON(http.StatusOK, gin.H{
		"employee_id":    empID,
		"from":           from,
		"to":             to,
		"total_turns":    totalTurns,
		"total_revenue":  totalRevenue,
		"avg_minutes":    math.Round(avgMinutes*10) / 10,
		"avg_rating":     math.Round(avgRating*10) / 10,
		"total_days":     totalDays,
		"present_days":   presentDays,
		"punctuality":    punctuality,
	})
}

func (h *EmployeeHandler) GetEarnings(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	empID := c.Param("id")
	from := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))

	var emp domain.Employee
	if err := h.DB.TT(uc.ClientID, "employees").Where("id = ?", empID).First(&emp).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "employee not found"})
		return
	}

	// Total DELIVERED turns in period
	var totalTurns int64
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_employee_id = ? AND status = ? AND created_at >= ? AND created_at <= ?", empID, "DELIVERED", from, to+" 23:59:59").
		Count(&totalTurns)

	// Total revenue from DELIVERED turns
	var totalRevenue float64
	h.DB.TT(uc.ClientID, "turns").
		Where("assigned_employee_id = ? AND status = ? AND created_at >= ? AND created_at <= ?", empID, "DELIVERED", from, to+" 23:59:59").
		Select("COALESCE(SUM(total_price), 0)").Row().Scan(&totalRevenue)

	// Commission total
	var commissionTotal float64
	h.DB.TT(uc.ClientID, "commissions").
		Where("employee_id = ? AND active = ?", empID, true).
		Select("COALESCE(SUM(value),0)").Row().Scan(&commissionTotal)

	var grossEarnings float64
	var rate float64

	switch emp.PaymentType {
	case "per_wash":
		rate = emp.AmountPerWash
		grossEarnings = float64(totalTurns)*emp.AmountPerWash + commissionTotal
	case "percentage":
		rate = emp.PercentageRate
		grossEarnings = totalRevenue*(emp.PercentageRate/100) + commissionTotal
	default: // fixed_salary
		rate = emp.BaseSalary
		grossEarnings = emp.BaseSalary + commissionTotal
	}

	// Deductions: only for non-prestacion_servicios contracts
	var deductions float64
	if emp.ContractType != "prestacion_servicios" {
		deductions = grossEarnings * 0.08 // 4% health + 4% pension
	}

	netEarnings := grossEarnings - deductions

	c.JSON(http.StatusOK, gin.H{
		"employee_id":    empID,
		"from":           from,
		"to":             to,
		"total_turns":    totalTurns,
		"total_revenue":  totalRevenue,
		"payment_type":   emp.PaymentType,
		"rate":           rate,
		"commissions":    commissionTotal,
		"gross_earnings": grossEarnings,
		"deductions":     deductions,
		"net_earnings":   netEarnings,
	})
}

func (h *EmployeeHandler) MarkAttendance(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.CreateAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	now := time.Now()
	todayStr := now.Format("2006-01-02")
	todayDate, _ := time.Parse("2006-01-02", todayStr)

	// Find employee by user_id
	var emp domain.Employee
	if err := h.DB.TT(uc.ClientID, "employees").Where("user_id = ?", uc.UserID).First(&emp).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "employee not found for this user"})
		return
	}

	// Check if already checked in today
	var existing domain.EmployeeAttendance
	err := h.DB.TT(uc.ClientID, "employee_attendances").Where("employee_id = ? AND date = ?", emp.ID, todayStr).First(&existing).Error
	if err == nil && existing.CheckOut == nil {
		// Check out
		h.DB.TT(uc.ClientID, "employee_attendances").Where("id = ?", existing.ID).Update("check_out", &now)
		c.JSON(http.StatusOK, dto.MessageResponse{Message: "check-out registrado"})
		return
	}

	att := domain.EmployeeAttendance{
		EmployeeID: emp.ID,
		ClientID:   uc.ClientID,
		Date:       todayDate,
		CheckIn:    &now,
		Method:     req.Method,
		Status:     "presente",
	}
	if err := h.DB.TT(uc.ClientID, "employee_attendances").Create(&att).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error marking attendance"})
		return
	}
	c.JSON(http.StatusCreated, dto.MessageResponse{Message: "check-in registrado"})
}
