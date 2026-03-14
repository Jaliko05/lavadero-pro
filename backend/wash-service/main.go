package main

import (
	"log"

	"github.com/falcore/wash-service/config"
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

	db := repository.NewDB(cfg)

	producer := messaging.NewProducer(cfg)
	if producer != nil {
		defer producer.Close()
	}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	routes.SetupRoutes(r, db, producer)

	log.Printf("Starting wash-service on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
