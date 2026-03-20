package handler

import (
	"fmt"
	"log"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/messaging"
	"github.com/falcore/wash-service/internal/repository"
)

// NotificationHelper encapsulates email notification logic for various domain events.
// All methods are safe - they log errors but never crash.
type NotificationHelper struct {
	DB       *repository.DBAdapter
	Producer *messaging.Producer
}

func NewNotificationHelper(db *repository.DBAdapter, producer *messaging.Producer) *NotificationHelper {
	return &NotificationHelper{DB: db, Producer: producer}
}

// getBrandData fetches WashConfig branding data for the given tenant.
func (n *NotificationHelper) getBrandData(clientID string) map[string]interface{} {
	data := map[string]interface{}{}
	var cfg domain.WashConfig
	if err := n.DB.TT(clientID, "wash_configs").Where("client_id = ?", clientID).First(&cfg).Error; err != nil {
		return data
	}
	data["brand_name"] = cfg.BusinessName
	data["brand_logo_url"] = cfg.LogoURL
	data["brand_color"] = "#0066CC" // default brand color
	return data
}

// SendTurnReady sends an email notification when a turn status changes to DONE (vehicle ready).
func (n *NotificationHelper) SendTurnReady(clientID, turnID string) {
	if n.Producer == nil {
		return
	}

	var turn domain.Turn
	if err := n.DB.TT(clientID, "turns").Where("id = ?", turnID).First(&turn).Error; err != nil {
		log.Printf("[notification] SendTurnReady: error finding turn %s: %v", turnID, err)
		return
	}

	if turn.CustomerID == nil {
		return
	}

	var customer domain.CustomerProfile
	if err := n.DB.TT(clientID, "customer_profiles").Where("id = ?", *turn.CustomerID).First(&customer).Error; err != nil {
		log.Printf("[notification] SendTurnReady: error finding customer: %v", err)
		return
	}

	if customer.Email == "" {
		return
	}

	data := n.getBrandData(clientID)
	data["name"] = customer.Name
	data["plate"] = turn.Plate

	if err := n.Producer.SendEmailNotification(messaging.EmailRequest{
		ClientID:      clientID,
		Type:          "notification",
		To:            customer.Email,
		Subject:       "Tu vehiculo esta listo!",
		Data:          data,
		SourceService: "wash-service",
	}); err != nil {
		log.Printf("[notification] SendTurnReady: error sending email: %v", err)
	}
}

// SendTurnDelivered sends a thank-you email when a turn is delivered.
func (n *NotificationHelper) SendTurnDelivered(clientID, turnID string) {
	if n.Producer == nil {
		return
	}

	var turn domain.Turn
	if err := n.DB.TT(clientID, "turns").Where("id = ?", turnID).First(&turn).Error; err != nil {
		log.Printf("[notification] SendTurnDelivered: error finding turn %s: %v", turnID, err)
		return
	}

	if turn.CustomerID == nil {
		return
	}

	var customer domain.CustomerProfile
	if err := n.DB.TT(clientID, "customer_profiles").Where("id = ?", *turn.CustomerID).First(&customer).Error; err != nil {
		log.Printf("[notification] SendTurnDelivered: error finding customer: %v", err)
		return
	}

	if customer.Email == "" {
		return
	}

	data := n.getBrandData(clientID)
	data["name"] = customer.Name
	data["plate"] = turn.Plate
	data["cta_url"] = fmt.Sprintf("/turn-status/%s?client_id=%s", turnID, clientID)

	if err := n.Producer.SendEmailNotification(messaging.EmailRequest{
		ClientID:      clientID,
		Type:          "notification",
		To:            customer.Email,
		Subject:       "Gracias por tu visita",
		Data:          data,
		SourceService: "wash-service",
	}); err != nil {
		log.Printf("[notification] SendTurnDelivered: error sending email: %v", err)
	}
}

// SendWelcomeCustomer sends a welcome email to a newly created customer.
func (n *NotificationHelper) SendWelcomeCustomer(clientID, customerID string) {
	if n.Producer == nil {
		return
	}

	var customer domain.CustomerProfile
	if err := n.DB.TT(clientID, "customer_profiles").Where("id = ?", customerID).First(&customer).Error; err != nil {
		log.Printf("[notification] SendWelcomeCustomer: error finding customer %s: %v", customerID, err)
		return
	}

	if customer.Email == "" {
		return
	}

	data := n.getBrandData(clientID)
	data["name"] = customer.Name

	if err := n.Producer.SendEmailNotification(messaging.EmailRequest{
		ClientID:      clientID,
		Type:          "welcome",
		To:            customer.Email,
		Subject:       "Bienvenido!",
		Data:          data,
		SourceService: "wash-service",
	}); err != nil {
		log.Printf("[notification] SendWelcomeCustomer: error sending email: %v", err)
	}
}

// SendPaymentReceipt sends a payment receipt email when a sale is fully paid.
func (n *NotificationHelper) SendPaymentReceipt(clientID, saleID string) {
	if n.Producer == nil {
		return
	}

	var sale domain.Sale
	if err := n.DB.TT(clientID, "sales").Where("id = ?", saleID).First(&sale).Error; err != nil {
		log.Printf("[notification] SendPaymentReceipt: error finding sale %s: %v", saleID, err)
		return
	}

	// Find customer email via turn
	var customerEmail, customerName string
	if sale.TurnID != nil {
		var turn domain.Turn
		if err := n.DB.TT(clientID, "turns").Where("id = ?", *sale.TurnID).First(&turn).Error; err == nil && turn.CustomerID != nil {
			var customer domain.CustomerProfile
			if err := n.DB.TT(clientID, "customer_profiles").Where("id = ?", *turn.CustomerID).First(&customer).Error; err == nil {
				customerEmail = customer.Email
				customerName = customer.Name
			}
		}
	}

	if customerEmail == "" {
		return
	}

	// Build items summary
	var items []domain.SaleItem
	n.DB.TT(clientID, "sale_items").Where("sale_id = ?", saleID).Find(&items)
	var itemsSummary string
	for _, item := range items {
		itemsSummary += fmt.Sprintf("%s x%d - $%.0f\n", item.ItemType, item.Quantity, item.Subtotal)
	}

	// Get payment method
	var lastPayment domain.Payment
	n.DB.TT(clientID, "payments").Where("sale_id = ?", saleID).Order("created_at DESC").First(&lastPayment)

	data := n.getBrandData(clientID)
	data["name"] = customerName
	data["amount"] = sale.Total
	data["items_summary"] = itemsSummary
	data["payment_method"] = lastPayment.Method

	if err := n.Producer.SendEmailNotification(messaging.EmailRequest{
		ClientID:      clientID,
		Type:          "invoice",
		To:            customerEmail,
		Subject:       fmt.Sprintf("Recibo de pago - $%.0f", sale.Total),
		Data:          data,
		SourceService: "wash-service",
	}); err != nil {
		log.Printf("[notification] SendPaymentReceipt: error sending email: %v", err)
	}
}

// SendLowStockAlert sends a low stock alert email to the business admin.
func (n *NotificationHelper) SendLowStockAlert(clientID, supplyName string, currentStock, minStock float64) {
	if n.Producer == nil {
		return
	}

	// Get business email from config
	var cfg domain.WashConfig
	if err := n.DB.TT(clientID, "wash_configs").Where("client_id = ?", clientID).First(&cfg).Error; err != nil || cfg.Email == "" {
		log.Printf("[notification] SendLowStockAlert: no business email configured")
		return
	}

	data := n.getBrandData(clientID)
	data["supply_name"] = supplyName
	data["current_stock"] = currentStock
	data["min_stock"] = minStock

	if err := n.Producer.SendEmailNotification(messaging.EmailRequest{
		ClientID:      clientID,
		Type:          "notification",
		To:            cfg.Email,
		Subject:       fmt.Sprintf("Alerta: Stock bajo - %s", supplyName),
		Data:          data,
		SourceService: "wash-service",
	}); err != nil {
		log.Printf("[notification] SendLowStockAlert: error sending email: %v", err)
	}
}
