package config

import "os"

type Config struct {
	Port                string
	DBConn              string
	RabbitMQURL         string
	EmailRequestQueue   string
	EmailReplyQueue     string
	StorageRequestQueue string
	StorageReplyQueue   string
	R2Bucket            string
	LogLevel            string
	CORSOrigins         string
	WompiServiceURL     string
}

func Load() *Config {
	return &Config{
		Port:                getEnv("PORT", "8082"),
		DBConn:              getEnv("DB_CONN", "postgres://postgres:postgres@localhost:5432/wash_db?sslmode=disable"),
		RabbitMQURL:         getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		EmailRequestQueue:   getEnv("EMAIL_REQUEST_QUEUE", "email_queue"),
		EmailReplyQueue:     getEnv("EMAIL_REPLY_QUEUE", "email_responses"),
		StorageRequestQueue: getEnv("STORAGE_REQUEST_QUEUE", "storage_requests"),
		StorageReplyQueue:   getEnv("STORAGE_REPLY_QUEUE", "storage_responses"),
		R2Bucket:            getEnv("R2_BUCKET", "wash-uploads"),
		LogLevel:            getEnv("LOG_LEVEL", "info"),
		CORSOrigins:         getEnv("CORS_ORIGINS", "http://localhost:5173"),
		WompiServiceURL:     getEnv("WOMPI_SERVICE_URL", "http://localhost:8083"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
