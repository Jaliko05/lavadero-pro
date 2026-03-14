package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/messaging"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	Producer *messaging.Producer
}

func NewUploadHandler(producer *messaging.Producer) *UploadHandler {
	return &UploadHandler{Producer: producer}
}

func (h *UploadHandler) RequestUploadURL(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req dto.UploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if h.Producer == nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{Error: "storage service unavailable"})
		return
	}

	resp, err := h.Producer.RequestStorageURL(messaging.StorageRequest{
		ClientID:    uc.ClientID,
		Action:      "put",
		Key:         req.Key,
		Bucket:      req.Bucket,
		ContentType: req.ContentType,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error requesting upload URL"})
		return
	}

	if !resp.Success {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: resp.Message})
		return
	}

	c.JSON(http.StatusOK, dto.UploadURLResponse{
		UploadURL: resp.URL,
		Key:       resp.Key,
	})
}

func (h *UploadHandler) GetFileURL(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	key := c.Query("key")
	bucket := c.Query("bucket")
	if key == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "key query parameter required"})
		return
	}

	if h.Producer == nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{Error: "storage service unavailable"})
		return
	}

	resp, err := h.Producer.RequestStorageURL(messaging.StorageRequest{
		ClientID: uc.ClientID,
		Action:   "get",
		Key:      key,
		Bucket:   bucket,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error getting file URL"})
		return
	}

	c.JSON(http.StatusOK, dto.UploadURLResponse{
		FileURL: resp.URL,
		Key:     resp.Key,
	})
}

func (h *UploadHandler) DeleteFile(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	key := c.Query("key")
	bucket := c.Query("bucket")
	if key == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "key query parameter required"})
		return
	}

	if h.Producer == nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{Error: "storage service unavailable"})
		return
	}

	resp, err := h.Producer.RequestStorageURL(messaging.StorageRequest{
		ClientID: uc.ClientID,
		Action:   "delete",
		Key:      key,
		Bucket:   bucket,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error deleting file"})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: resp.Message})
}
