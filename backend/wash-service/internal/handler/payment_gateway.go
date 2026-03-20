package handler

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

// PaymentGatewayHandler proxies payment requests to the wompi-service
type PaymentGatewayHandler struct {
	WompiServiceURL string
	DB              *repository.DBAdapter
	httpClient      *http.Client
}

func NewPaymentGatewayHandler(wompiURL string, db *repository.DBAdapter) *PaymentGatewayHandler {
	return &PaymentGatewayHandler{
		WompiServiceURL: strings.TrimRight(wompiURL, "/"),
		DB:              db,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// InitPayment forwards a payment initialization request to the wompi-service.
func (h *PaymentGatewayHandler) InitPayment(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to read request body"})
		return
	}
	defer c.Request.Body.Close()

	resp, respBody, statusCode, err := h.forwardToWompi(c, http.MethodPost, "/v1/wompi/payment/init", body)
	if err != nil {
		c.JSON(http.StatusBadGateway, dto.ErrorResponse{Error: "failed to reach wompi-service"})
		return
	}
	defer resp.Body.Close()

	c.Data(statusCode, "application/json", respBody)
}

// ListPaymentMethods forwards a request to list payment methods from the wompi-service.
func (h *PaymentGatewayHandler) ListPaymentMethods(c *gin.Context) {
	resp, respBody, statusCode, err := h.forwardToWompi(c, http.MethodGet, "/v1/wompi/payment-methods", nil)
	if err != nil {
		c.JSON(http.StatusBadGateway, dto.ErrorResponse{Error: "failed to reach wompi-service"})
		return
	}
	defer resp.Body.Close()

	c.Data(statusCode, "application/json", respBody)
}

// DeletePaymentMethod forwards a delete payment method request to the wompi-service.
func (h *PaymentGatewayHandler) DeletePaymentMethod(c *gin.Context) {
	id := c.Param("id")
	path := fmt.Sprintf("/v1/wompi/payment-methods/%s", id)

	resp, respBody, statusCode, err := h.forwardToWompi(c, http.MethodDelete, path, nil)
	if err != nil {
		c.JSON(http.StatusBadGateway, dto.ErrorResponse{Error: "failed to reach wompi-service"})
		return
	}
	defer resp.Body.Close()

	c.Data(statusCode, "application/json", respBody)
}

// WompiWebhook receives Wompi webhook events, processes transaction status updates,
// and forwards the webhook to the wompi-service.
func (h *PaymentGatewayHandler) WompiWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "failed to read webhook body"})
		return
	}
	defer c.Request.Body.Close()

	// Parse the webhook to extract transaction data
	var webhook struct {
		Event string `json:"event"`
		Data  struct {
			Transaction struct {
				ID        string `json:"id"`
				Status    string `json:"status"`
				Reference string `json:"reference"`
				Amount    int64  `json:"amount_in_cents"`
				Method    string `json:"payment_method_type"`
			} `json:"transaction"`
		} `json:"data"`
	}

	if err := c.ShouldBindJSON(&webhook); err == nil {
		txn := webhook.Data.Transaction

		if strings.EqualFold(txn.Status, "APPROVED") && txn.Reference != "" {
			// Find the sale by reference. The reference format is "sale-<sale_id>" or similar.
			// Try to extract sale ID from reference
			h.processApprovedTransaction(txn.Reference, txn.Amount, txn.Method, txn.ID)
		}
	}

	// Forward webhook to wompi-service regardless of local processing
	resp, respBody, statusCode, fwdErr := h.forwardToWompi(c, http.MethodPost, "/v1/wompi/webhook", body)
	if fwdErr != nil {
		c.JSON(http.StatusBadGateway, dto.ErrorResponse{Error: "failed to forward webhook to wompi-service"})
		return
	}
	defer resp.Body.Close()

	c.Data(statusCode, "application/json", respBody)
}

// processApprovedTransaction updates the sale payment status and creates a Payment record
// when a Wompi transaction is approved.
func (h *PaymentGatewayHandler) processApprovedTransaction(reference string, amountCents int64, method string, transactionID string) {
	// Reference format: "sale-<sale_id>" — extract the sale ID
	saleID := reference
	if strings.HasPrefix(reference, "sale-") {
		saleID = strings.TrimPrefix(reference, "sale-")
	}

	// We need to find the sale across tenants. Since the reference contains the sale ID,
	// we search for it. In a multi-tenant setup, the webhook doesn't carry client_id,
	// so we look up the sale using the underlying gorm.DB directly.
	var sale domain.Sale
	if err := h.DB.DB.Raw("SELECT * FROM sales WHERE id = ? LIMIT 1", saleID).Scan(&sale).Error; err != nil || sale.ID == "" {
		return
	}

	// Map Wompi payment method to local method names
	localMethod := mapWompiMethod(method)
	amountFloat := float64(amountCents) / 100.0

	// Create Payment record
	payment := domain.Payment{
		SaleID:    sale.ID,
		ClientID:  sale.ClientID,
		Method:    localMethod,
		Amount:    amountFloat,
		Reference: transactionID,
		Confirmed: true,
	}
	h.DB.TT(sale.ClientID, "payments").Create(&payment)

	// Update sale payment_status to "pagado"
	h.DB.TT(sale.ClientID, "sales").Where("id = ?", sale.ID).Update("payment_status", "pagado")
}

// forwardToWompi sends an HTTP request to the wompi-service, forwarding Kong gateway headers.
func (h *PaymentGatewayHandler) forwardToWompi(c *gin.Context, method string, path string, body []byte) (*http.Response, []byte, int, error) {
	url := h.WompiServiceURL + path

	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequestWithContext(c.Request.Context(), method, url, reqBody)
	if err != nil {
		return nil, nil, 0, err
	}

	// Forward Kong headers
	for _, header := range []string{"X-User-ID", "X-Client-ID", "X-Email", "X-Roles"} {
		if val := c.GetHeader(header); val != "" {
			req.Header.Set(header, val)
		}
	}

	// Also try to get headers from the middleware user context (in case headers were consumed)
	if uc := middleware.GetUserContext(c); uc != nil {
		if req.Header.Get("X-User-ID") == "" {
			req.Header.Set("X-User-ID", uc.UserID)
		}
		if req.Header.Get("X-Client-ID") == "" {
			req.Header.Set("X-Client-ID", uc.ClientID)
		}
		if req.Header.Get("X-Email") == "" {
			req.Header.Set("X-Email", uc.Email)
		}
		if req.Header.Get("X-Roles") == "" && len(uc.Roles) > 0 {
			req.Header.Set("X-Roles", strings.Join(uc.Roles, ","))
		}
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, nil, 0, err
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp, nil, resp.StatusCode, err
	}

	return resp, respBody, resp.StatusCode, nil
}

// mapWompiMethod converts Wompi payment method types to local method names.
func mapWompiMethod(wompiMethod string) string {
	switch strings.ToUpper(wompiMethod) {
	case "CARD":
		return "tarjeta"
	case "NEQUI":
		return "nequi"
	case "BANCOLOMBIA_TRANSFER":
		return "transferencia"
	case "DAVIPLATA":
		return "daviplata"
	default:
		return strings.ToLower(wompiMethod)
	}
}
