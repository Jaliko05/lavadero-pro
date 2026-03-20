package handler

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ExpenseHandler struct{ DB *repository.DBAdapter }

func NewExpenseHandler(db *repository.DBAdapter) *ExpenseHandler {
	return &ExpenseHandler{DB: db}
}

// --- Expenses ---

func (h *ExpenseHandler) ListExpenses(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var expenses []domain.Expense
	q := h.DB.TT(uc.ClientID, "expenses")
	if cat := c.Query("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if from := c.Query("from"); from != "" {
		q = q.Where("date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("date <= ?", to)
	}
	if err := q.Order("date DESC").Find(&expenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading expenses"})
		return
	}
	c.JSON(http.StatusOK, expenses)
}

func (h *ExpenseHandler) CreateExpense(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Category      string  `json:"category" binding:"required"`
		Description   string  `json:"description" binding:"required"`
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"`
		SupplierID    *string `json:"supplier_id"`
		ReceiptURL    *string `json:"receipt_url"`
		Date          string  `json:"date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	date, _ := time.Parse("2006-01-02", req.Date)
	var receiptURL string
	if req.ReceiptURL != nil {
		receiptURL = *req.ReceiptURL
	}
	exp := domain.Expense{
		ClientID:      uc.ClientID,
		Category:      req.Category,
		Description:   req.Description,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		SupplierID:    req.SupplierID,
		ReceiptURL:    receiptURL,
		RegisteredBy:  uc.UserID,
		Date:          date,
	}
	if err := h.DB.TT(uc.ClientID, "expenses").Create(&exp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating expense"})
		return
	}
	c.JSON(http.StatusCreated, exp)
}

func (h *ExpenseHandler) UpdateExpense(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Category      *string  `json:"category"`
		Description   *string  `json:"description"`
		Amount        *float64 `json:"amount"`
		PaymentMethod *string  `json:"payment_method"`
		SupplierID    *string  `json:"supplier_id"`
		ReceiptURL    *string  `json:"receipt_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Category != nil { updates["category"] = *req.Category }
	if req.Description != nil { updates["description"] = *req.Description }
	if req.Amount != nil { updates["amount"] = *req.Amount }
	if req.PaymentMethod != nil { updates["payment_method"] = *req.PaymentMethod }
	if req.SupplierID != nil { updates["supplier_id"] = *req.SupplierID }
	if req.ReceiptURL != nil { updates["receipt_url"] = *req.ReceiptURL }
	result := h.DB.TT(uc.ClientID, "expenses").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "expense not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "expense updated"})
}

func (h *ExpenseHandler) DeleteExpense(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "expenses").Where("id = ?", c.Param("id")).Delete(&domain.Expense{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "expense not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "expense deleted"})
}

// --- Recurring Expenses ---

func (h *ExpenseHandler) ListRecurring(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var items []domain.RecurringExpense
	if err := h.DB.TT(uc.ClientID, "recurring_expenses").Order("name ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading recurring expenses"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ExpenseHandler) CreateRecurring(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name      string  `json:"name" binding:"required"`
		Category  string  `json:"category" binding:"required"`
		Amount    float64 `json:"amount" binding:"required"`
		Frequency string  `json:"frequency" binding:"required"`
		DueDay    int     `json:"due_day" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	re := domain.RecurringExpense{
		ClientID:  uc.ClientID,
		Name:      req.Name,
		Category:  req.Category,
		Amount:    req.Amount,
		Frequency: req.Frequency,
		DueDay:    req.DueDay,
		Active:    true,
	}
	if err := h.DB.TT(uc.ClientID, "recurring_expenses").Create(&re).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating recurring expense"})
		return
	}
	c.JSON(http.StatusCreated, re)
}

func (h *ExpenseHandler) UpdateRecurring(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Name      *string  `json:"name"`
		Category  *string  `json:"category"`
		Amount    *float64 `json:"amount"`
		Frequency *string  `json:"frequency"`
		DueDay    *int     `json:"due_day"`
		Active    *bool    `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil { updates["name"] = *req.Name }
	if req.Category != nil { updates["category"] = *req.Category }
	if req.Amount != nil { updates["amount"] = *req.Amount }
	if req.Frequency != nil { updates["frequency"] = *req.Frequency }
	if req.DueDay != nil { updates["due_day"] = *req.DueDay }
	if req.Active != nil { updates["active"] = *req.Active }
	result := h.DB.TT(uc.ClientID, "recurring_expenses").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "recurring expense not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "recurring expense updated"})
}

func (h *ExpenseHandler) DeleteRecurring(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "recurring_expenses").Where("id = ?", c.Param("id")).Delete(&domain.RecurringExpense{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "recurring expense not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "recurring expense deleted"})
}

// --- Incomes ---

func (h *ExpenseHandler) ListIncomes(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var incomes []domain.Income
	q := h.DB.TT(uc.ClientID, "incomes")
	if cat := c.Query("category"); cat != "" {
		q = q.Where("category = ?", cat)
	}
	if from := c.Query("from"); from != "" {
		q = q.Where("date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		q = q.Where("date <= ?", to)
	}
	if src := c.Query("source_type"); src != "" {
		q = q.Where("source_type = ?", src)
	}
	if err := q.Order("date DESC").Find(&incomes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading incomes"})
		return
	}
	c.JSON(http.StatusOK, incomes)
}

func (h *ExpenseHandler) CreateIncome(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Category      string  `json:"category"`
		Description   string  `json:"description" binding:"required"`
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"`
		Date          string  `json:"date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	date, _ := time.Parse("2006-01-02", req.Date)
	income := domain.Income{
		ClientID:      uc.ClientID,
		Category:      req.Category,
		Description:   req.Description,
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		SourceType:    "manual",
		RegisteredBy:  uc.UserID,
		Date:          date,
	}
	if err := h.DB.TT(uc.ClientID, "incomes").Create(&income).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating income"})
		return
	}
	c.JSON(http.StatusCreated, income)
}

func (h *ExpenseHandler) UpdateIncome(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Category      *string  `json:"category"`
		Description   *string  `json:"description"`
		Amount        *float64 `json:"amount"`
		PaymentMethod *string  `json:"payment_method"`
		Date          *string  `json:"date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.Category != nil { updates["category"] = *req.Category }
	if req.Description != nil { updates["description"] = *req.Description }
	if req.Amount != nil { updates["amount"] = *req.Amount }
	if req.PaymentMethod != nil { updates["payment_method"] = *req.PaymentMethod }
	if req.Date != nil {
		d, _ := time.Parse("2006-01-02", *req.Date)
		updates["date"] = d
	}
	result := h.DB.TT(uc.ClientID, "incomes").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "income not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "income updated"})
}

func (h *ExpenseHandler) DeleteIncome(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "incomes").Where("id = ?", c.Param("id")).Delete(&domain.Income{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "income not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "income deleted"})
}

// --- Accounts Receivable ---

func (h *ExpenseHandler) ListAccountsReceivable(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var items []domain.AccountReceivable
	q := h.DB.TT(uc.ClientID, "account_receivables")
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("due_date ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading accounts receivable"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ExpenseHandler) CreateAccountReceivable(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		CustomerID  string  `json:"customer_id" binding:"required"`
		SaleID      *string `json:"sale_id"`
		TotalAmount float64 `json:"total_amount" binding:"required"`
		DueDate     *string `json:"due_date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	ar := domain.AccountReceivable{
		ClientID:    uc.ClientID,
		CustomerID:  req.CustomerID,
		SaleID:      req.SaleID,
		TotalAmount: req.TotalAmount,
		Status:      "al_dia",
	}
	if req.DueDate != nil {
		d, _ := time.Parse("2006-01-02", *req.DueDate)
		ar.DueDate = &d
	}
	if err := h.DB.TT(uc.ClientID, "account_receivables").Create(&ar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating account receivable"})
		return
	}
	c.JSON(http.StatusCreated, ar)
}

func (h *ExpenseHandler) PayAccountReceivable(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		Amount        float64 `json:"amount" binding:"required,gt=0"`
		PaymentMethod string  `json:"payment_method" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	arID := c.Param("id")
	var ar domain.AccountReceivable
	if err := h.DB.TT(uc.ClientID, "account_receivables").Where("id = ?", arID).First(&ar).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "account receivable not found"})
		return
	}

	remaining := ar.TotalAmount - ar.PaidAmount
	if req.Amount > remaining {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "payment exceeds remaining balance"})
		return
	}

	newPaid := ar.PaidAmount + req.Amount
	updates := map[string]interface{}{"paid_amount": newPaid}
	if newPaid >= ar.TotalAmount {
		updates["status"] = "pagada"
	}
	h.DB.TT(uc.ClientID, "account_receivables").Where("id = ?", arID).Updates(updates)

	// Create income record for the payment
	income := domain.Income{
		ClientID:      uc.ClientID,
		Category:      "cuenta_por_cobrar",
		Description:   "Pago cuenta por cobrar #" + arID[:8],
		Amount:        req.Amount,
		PaymentMethod: req.PaymentMethod,
		SourceType:    "account_receivable",
		SourceID:      &arID,
		RegisteredBy:  uc.UserID,
		Date:          time.Now(),
	}
	h.DB.TT(uc.ClientID, "incomes").Create(&income)

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "payment registered"})
}

// --- Cash Flow ---

func (h *ExpenseHandler) CashFlow(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))
	projectionDays, _ := strconv.Atoi(c.DefaultQuery("projection_days", "0"))

	var totalIncome, totalExpense float64
	h.DB.TT(uc.ClientID, "incomes").Where("date >= ? AND date <= ?", from, to).Select("COALESCE(SUM(amount),0)").Row().Scan(&totalIncome)
	h.DB.TT(uc.ClientID, "expenses").Where("date >= ? AND date <= ?", from, to).Select("COALESCE(SUM(amount),0)").Row().Scan(&totalExpense)

	// Daily breakdown
	type DailyRow struct {
		Date    string  `json:"date"`
		Amount  float64 `json:"amount"`
	}
	var dailyIncomes []DailyRow
	h.DB.TT(uc.ClientID, "incomes").
		Where("date >= ? AND date <= ?", from, to).
		Select("TO_CHAR(date, 'YYYY-MM-DD') as date, SUM(amount) as amount").
		Group("TO_CHAR(date, 'YYYY-MM-DD')").Order("date ASC").Scan(&dailyIncomes)

	var dailyExpenses []DailyRow
	h.DB.TT(uc.ClientID, "expenses").
		Where("date >= ? AND date <= ?", from, to).
		Select("TO_CHAR(date, 'YYYY-MM-DD') as date, SUM(amount) as amount").
		Group("TO_CHAR(date, 'YYYY-MM-DD')").Order("date ASC").Scan(&dailyExpenses)

	// Build maps for quick lookup
	incomeMap := make(map[string]float64)
	for _, d := range dailyIncomes {
		incomeMap[d.Date] = d.Amount
	}
	expenseMap := make(map[string]float64)
	for _, d := range dailyExpenses {
		expenseMap[d.Date] = d.Amount
	}

	// Generate daily array for all dates in range
	fromDate, _ := time.Parse("2006-01-02", from)
	toDate, _ := time.Parse("2006-01-02", to)
	var daily []gin.H
	for d := fromDate; !d.After(toDate); d = d.AddDate(0, 0, 1) {
		ds := d.Format("2006-01-02")
		inc := incomeMap[ds]
		exp := expenseMap[ds]
		daily = append(daily, gin.H{
			"date":     ds,
			"income":   inc,
			"expenses": exp,
			"net":      inc - exp,
		})
	}

	result := gin.H{
		"from":          from,
		"to":            to,
		"total_income":  totalIncome,
		"total_expense": totalExpense,
		"net":           totalIncome - totalExpense,
		"actual": gin.H{
			"income":   totalIncome,
			"expenses": totalExpense,
			"net":      totalIncome - totalExpense,
		},
		"daily": daily,
	}

	// Projection
	if projectionDays > 0 {
		// Calculate average daily income/expense from the last 30 days
		last30From := time.Now().AddDate(0, 0, -30).Format("2006-01-02")
		last30To := time.Now().Format("2006-01-02")

		var avgIncome30, avgExpense30 float64
		h.DB.TT(uc.ClientID, "incomes").
			Where("date >= ? AND date <= ?", last30From, last30To).
			Select("COALESCE(SUM(amount),0)").Row().Scan(&avgIncome30)
		h.DB.TT(uc.ClientID, "expenses").
			Where("date >= ? AND date <= ?", last30From, last30To).
			Select("COALESCE(SUM(amount),0)").Row().Scan(&avgExpense30)

		avgDailyIncome := avgIncome30 / 30.0
		avgDailyExpense := avgExpense30 / 30.0

		// Load active recurring expenses for projection
		var recurringExpenses []domain.RecurringExpense
		h.DB.TT(uc.ClientID, "recurring_expenses").Where("active = ?", true).Find(&recurringExpenses)

		// Build recurring expense schedule by day-of-month
		recurringByDay := make(map[int]float64)
		for _, re := range recurringExpenses {
			switch re.Frequency {
			case "monthly":
				recurringByDay[re.DueDay] += re.Amount
			case "biweekly":
				recurringByDay[re.DueDay] += re.Amount
				day2 := re.DueDay + 15
				if day2 > 28 { day2 = 28 }
				recurringByDay[day2] += re.Amount
			case "quarterly":
				recurringByDay[re.DueDay] += re.Amount
			}
		}

		startProjection := time.Now().AddDate(0, 0, 1)
		var projection []gin.H
		for i := 0; i < projectionDays; i++ {
			d := startProjection.AddDate(0, 0, i)
			ds := d.Format("2006-01-02")
			projIncome := math.Round(avgDailyIncome*100) / 100
			projExpense := math.Round(avgDailyExpense*100) / 100

			// Add scheduled recurring expenses for this day
			if extra, ok := recurringByDay[d.Day()]; ok {
				projExpense += extra
			}

			projection = append(projection, gin.H{
				"date":              ds,
				"projected_income":  projIncome,
				"projected_expenses": projExpense,
				"projected_net":     math.Round((projIncome-projExpense)*100) / 100,
			})
		}
		result["projection"] = projection
	}

	c.JSON(http.StatusOK, result)
}

// --- Profit & Loss ---

func (h *ExpenseHandler) ProfitLoss(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	from := c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))

	var totalIncome, totalExpense float64
	h.DB.TT(uc.ClientID, "incomes").Where("date >= ? AND date <= ?", from, to).Select("COALESCE(SUM(amount),0)").Row().Scan(&totalIncome)
	h.DB.TT(uc.ClientID, "expenses").Where("date >= ? AND date <= ?", from, to).Select("COALESCE(SUM(amount),0)").Row().Scan(&totalExpense)

	// Payroll costs
	var payrollCost float64
	h.DB.TT(uc.ClientID, "payrolls").Where("period_start >= ? AND period_end <= ? AND status = ?", from, to, "approved").Select("COALESCE(SUM(total_net),0)").Row().Scan(&payrollCost)

	totalCosts := totalExpense + payrollCost

	c.JSON(http.StatusOK, gin.H{
		"from":           from,
		"to":             to,
		"revenue":        totalIncome,
		"expenses":       totalExpense,
		"payroll":        payrollCost,
		"total_costs":    totalCosts,
		"profit":         totalIncome - totalCosts,
		"profit_margin":  safeDiv(totalIncome-totalCosts, totalIncome) * 100,
	})
}

func safeDiv(a, b float64) float64 {
	if b == 0 { return 0 }
	return a / b
}
