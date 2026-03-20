package main

import (
	"github.com/falcore/wash-service/config"
	"github.com/falcore/wash-service/internal/applog"
	"github.com/falcore/wash-service/internal/messaging"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/falcore/wash-service/routes"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	logger := applog.NewFromEnv()

	logger.Info("Initializing wash-service")

	db := repository.NewDB(cfg)

	producer := messaging.NewProducer(cfg)
	if producer != nil {
		defer producer.Close()
		logger.Info("RabbitMQ producer connected")
	} else {
		logger.Warn("RabbitMQ not available, messaging features disabled")
	}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	routes.SetupRoutes(r, db, producer, cfg)

	logger.Info("Starting wash-service on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		logger.Fatal("Failed to start server: %v", err)
	}
}
