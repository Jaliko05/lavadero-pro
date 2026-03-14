package messaging

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/falcore/wash-service/config"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

type Producer struct {
	conn                 *amqp.Connection
	channel              *amqp.Channel
	emailQueue           string
	storageQueue         string
	storageResponseQueue string
	r2Bucket             string

	pending struct {
		sync.Mutex
		m map[string]chan []byte
	}
}

func NewProducer(cfg *config.Config) *Producer {
	conn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Printf("WARNING: RabbitMQ not available: %v", err)
		return nil
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("WARNING: Failed to open RabbitMQ channel: %v", err)
		return nil
	}

	queues := []string{
		cfg.EmailRequestQueue, cfg.EmailReplyQueue,
		cfg.StorageRequestQueue, cfg.StorageReplyQueue,
	}
	for _, q := range queues {
		ch.QueueDeclare(q, true, false, false, false, nil)
	}

	p := &Producer{
		conn:                 conn,
		channel:              ch,
		emailQueue:           cfg.EmailRequestQueue,
		storageQueue:         cfg.StorageRequestQueue,
		storageResponseQueue: cfg.StorageReplyQueue,
		r2Bucket:             cfg.R2Bucket,
	}
	p.pending.m = make(map[string]chan []byte)

	p.startStorageResponseConsumer()

	return p
}

func (p *Producer) startStorageResponseConsumer() {
	msgs, err := p.channel.Consume(p.storageResponseQueue, "wash-storage-consumer", true, false, false, false, nil)
	if err != nil {
		log.Printf("WARNING: Failed to start storage response consumer: %v", err)
		return
	}

	go func() {
		for d := range msgs {
			p.dispatchPending(d.CorrelationId, d.Body)
		}
	}()

	log.Printf("Storage response consumer started on queue: %s", p.storageResponseQueue)
}

func (p *Producer) dispatchPending(correlationID string, body []byte) bool {
	p.pending.Lock()
	defer p.pending.Unlock()

	ch, ok := p.pending.m[correlationID]
	if !ok {
		return false
	}

	ch <- body
	delete(p.pending.m, correlationID)
	return true
}

// SendEmailNotification publishes an email request following the Falcore Email Service Standard.
func (p *Producer) SendEmailNotification(req EmailRequest) error {
	if req.SourceService == "" {
		req.SourceService = "wash-service"
	}
	return p.publish(p.emailQueue, req, uuid.New().String(), nil)
}

// RequestStorageURL sends a storage request to R2 service and waits for response.
func (p *Producer) RequestStorageURL(req StorageRequest) (*StorageResponse, error) {
	if req.Bucket == "" {
		req.Bucket = p.r2Bucket
	}
	if req.SourceService == "" {
		req.SourceService = "wash-service"
	}

	body, err := p.rpc(p.storageQueue, req, nil, 30*time.Second)
	if err != nil {
		return nil, err
	}

	var resp StorageResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func (p *Producer) rpc(queue string, data interface{}, headers amqp.Table, timeout time.Duration) ([]byte, error) {
	corrID := uuid.New().String()
	responseCh := make(chan []byte, 1)

	p.pending.Lock()
	p.pending.m[corrID] = responseCh
	p.pending.Unlock()

	if err := p.publish(queue, data, corrID, headers); err != nil {
		p.pending.Lock()
		delete(p.pending.m, corrID)
		p.pending.Unlock()
		return nil, err
	}

	select {
	case body := <-responseCh:
		return body, nil
	case <-time.After(timeout):
		p.pending.Lock()
		delete(p.pending.m, corrID)
		p.pending.Unlock()
		return nil, context.DeadlineExceeded
	}
}

func (p *Producer) publish(queue string, data interface{}, correlationID string, headers amqp.Table) error {
	body, err := json.Marshal(data)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pub := amqp.Publishing{
		ContentType: "application/json",
		Body:        body,
	}
	if correlationID != "" {
		pub.CorrelationId = correlationID
	}
	if headers != nil {
		pub.Headers = headers
	}

	return p.channel.PublishWithContext(ctx, "", queue, false, false, pub)
}

func (p *Producer) Close() {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
}
