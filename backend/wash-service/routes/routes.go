package routes

import (
	"net/http"

	"github.com/falcore/wash-service/internal/handler"
	"github.com/falcore/wash-service/internal/messaging"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func SetupRoutes(r *gin.Engine, db *repository.DBAdapter, producer *messaging.Producer) {
	turnH := handler.NewTurnHandler(db)
	vehicleCatH := handler.NewVehicleCategoryHandler(db)
	washSvcH := handler.NewWashServiceHandler(db)
	clientH := handler.NewClientHandler(db)
	dashH := handler.NewDashboardHandler(db)
	uploadH := handler.NewUploadHandler(producer)
	ratingH := handler.NewRatingHandler(db)

	// Observability
	r.GET("/wash/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	r.GET("/wash/metrics", gin.WrapH(promhttp.Handler()))

	wash := r.Group("/v1/wash")

	// ========================
	// PUBLIC ROUTES (no auth)
	// ========================
	pub := wash.Group("")
	pub.Use(middleware.OptionalAuthMiddleware())
	{
		pub.GET("/display/:client_id", turnH.Display)
		pub.GET("/turn-status/:turn_id", turnH.PublicTurnStatus)
		pub.POST("/ratings", ratingH.CreatePublic)
		pub.GET("/services", washSvcH.ListPublic)
		pub.GET("/clients/:id", clientH.Get)
	}

	// ========================
	// AUTHENTICATED ROUTES
	// ========================
	auth := wash.Group("")
	auth.Use(middleware.AuthMiddleware())
	{
		// Turns
		auth.POST("/turns", turnH.Create)
		auth.GET("/turns", turnH.List)
		auth.GET("/turns/:id", turnH.GetByID)
		auth.PATCH("/turns/:id/status", turnH.UpdateStatus)
		auth.PATCH("/turns/:id/assign", turnH.Assign)
		auth.POST("/turns/:id/services", turnH.AddService)
		auth.GET("/turns/:id/history", turnH.GetStatusHistory)

		// My (employee view)
		auth.GET("/my/turns", turnH.MyTurns)

		// Client
		auth.GET("/clients/me", clientH.GetMyClient)
	}

	// ========================
	// ADMIN ROUTES
	// ========================
	admin := wash.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RequireRole("admin", "super_admin"))
	{
		// Dashboard
		admin.GET("/dashboard/stats", dashH.Stats)
		admin.GET("/dashboard/revenue-trend", dashH.RevenueTrend)
		admin.GET("/dashboard/turns-by-status", dashH.TurnsByStatus)
		admin.GET("/dashboard/top-services", dashH.TopServices)
		admin.GET("/dashboard/employee-ranking", dashH.EmployeeRanking)

		// Vehicle Categories
		admin.GET("/vehicle-categories", vehicleCatH.List)
		admin.POST("/vehicle-categories", vehicleCatH.Create)
		admin.PUT("/vehicle-categories/:id", vehicleCatH.Update)
		admin.DELETE("/vehicle-categories/:id", vehicleCatH.Delete)

		// Wash Services
		admin.GET("/services", washSvcH.AdminList)
		admin.POST("/services", washSvcH.Create)
		admin.PUT("/services/:id", washSvcH.Update)
		admin.DELETE("/services/:id", washSvcH.Delete)

		// Upload (R2 storage)
		admin.POST("/upload/request-url", uploadH.RequestUploadURL)
		admin.GET("/upload/file-url", uploadH.GetFileURL)
		admin.DELETE("/upload/file", uploadH.DeleteFile)
	}

	// ========================
	// SUPER ADMIN ROUTES
	// ========================
	superAdmin := wash.Group("/super-admin")
	superAdmin.Use(middleware.AuthMiddleware())
	superAdmin.Use(middleware.RequireRole("super_admin"))
	{
		superAdmin.POST("/clients", clientH.Create)
		superAdmin.GET("/clients", clientH.List)
		superAdmin.PUT("/clients/:id", clientH.Update)
		superAdmin.DELETE("/clients/:id", clientH.Delete)
	}
}
