package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ClientHandler struct {
	DB *repository.DBAdapter
}

func NewClientHandler(db *repository.DBAdapter) *ClientHandler {
	return &ClientHandler{DB: db}
}

func (h *ClientHandler) Create(c *gin.Context) {
	var req dto.CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	client := domain.Client{
		Nombre:    req.Nombre,
		NIT:       req.NIT,
		Email:     req.Email,
		Telefono:  req.Telefono,
		Direccion: req.Direccion,
		Ciudad:    req.Ciudad,
		Moneda:    req.Moneda,
		Impuesto:  req.Impuesto,
	}

	if err := h.DB.DB.Create(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating client"})
		return
	}

	// Create tenant schema
	if err := h.DB.CreateTenantSchema(client.ID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating tenant schema"})
		return
	}

	c.JSON(http.StatusCreated, client)
}

func (h *ClientHandler) List(c *gin.Context) {
	var clients []domain.Client
	if err := h.DB.DB.Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading clients"})
		return
	}
	c.JSON(http.StatusOK, clients)
}

func (h *ClientHandler) Get(c *gin.Context) {
	var client domain.Client
	if err := h.DB.DB.Where("id = ?", c.Param("id")).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) GetMyClient(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var client domain.Client
	if err := h.DB.DB.Where("id = ?", uc.ClientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientHandler) Update(c *gin.Context) {
	var req dto.UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.NIT != nil {
		updates["nit"] = *req.NIT
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Telefono != nil {
		updates["telefono"] = *req.Telefono
	}
	if req.Activo != nil {
		updates["activo"] = *req.Activo
	}

	result := h.DB.DB.Model(&domain.Client{}).Where("id = ?", c.Param("id")).Updates(updates)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "client updated"})
}

func (h *ClientHandler) Delete(c *gin.Context) {
	result := h.DB.DB.Where("id = ?", c.Param("id")).Delete(&domain.Client{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "client deleted"})
}
