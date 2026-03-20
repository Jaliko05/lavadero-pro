package messaging

import (
	"encoding/json"
	"log"

	"github.com/falcore/wash-service/config"
	amqp "github.com/rabbitmq/amqp091-go"
)

// Consumer handles incoming RabbitMQ messages (e.g., async responses from other services).
type Consumer struct {
	conn    *amqp.Connection
	channel *amqp.Channel
	handler MessageHandler
}

// MessageHandler processes incoming messages from subscribed queues.
type MessageHandler interface {
	HandleEmailResponse(resp EmailResponse)
}

// EmailResponse represents an async response from the email service.
type EmailResponse struct {
	Success       bool   `json:"success"`
	Message       string `json:"message"`
	ErrorCode     string `json:"error_code,omitempty"`
	ClientID      string `json:"client_id"`
	CorrelationID string `json:"correlation_id"`
	SourceService string `json:"source_service"`
}

func NewConsumer(cfg *config.Config, handler MessageHandler) *Consumer {
	conn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Printf("WARNING: Consumer RabbitMQ not available: %v", err)
		return nil
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("WARNING: Consumer failed to open channel: %v", err)
		conn.Close()
		return nil
	}

	if err := ch.Qos(10, 0, false); err != nil {
		log.Printf("WARNING: Consumer failed to set QoS: %v", err)
	}

	c := &Consumer{
		conn:    conn,
		channel: ch,
		handler: handler,
	}

	c.startEmailResponseConsumer(cfg.EmailReplyQueue)

	return c
}

func (c *Consumer) startEmailResponseConsumer(queue string) {
	msgs, err := c.channel.Consume(queue, "wash-email-response-consumer", false, false, false, false, nil)
	if err != nil {
		log.Printf("WARNING: Failed to start email response consumer: %v", err)
		return
	}

	go func() {
		for d := range msgs {
			var resp EmailResponse
			if err := json.Unmarshal(d.Body, &resp); err != nil {
				log.Printf("ERROR: Failed to unmarshal email response: %v", err)
				d.Nack(false, false)
				continue
			}

			if c.handler != nil {
				c.handler.HandleEmailResponse(resp)
			}

			d.Ack(false)
		}
	}()

	log.Printf("Email response consumer started on queue: %s", queue)
}

func (c *Consumer) Close() {
	if c.channel != nil {
		c.channel.Close()
	}
	if c.conn != nil {
		c.conn.Close()
	}
}
