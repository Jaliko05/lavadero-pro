package handler

import (
	"net/http"

	"github.com/falcore/wash-service/internal/domain"
	"github.com/falcore/wash-service/internal/dto"
	"github.com/falcore/wash-service/internal/middleware"
	"github.com/falcore/wash-service/internal/repository"
	"github.com/gin-gonic/gin"
)

type ScheduleHandler struct{ DB *repository.DBAdapter }

func NewScheduleHandler(db *repository.DBAdapter) *ScheduleHandler {
	return &ScheduleHandler{DB: db}
}

func (h *ScheduleHandler) List(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var schedules []domain.EmployeeSchedule
	q := h.DB.TT(uc.ClientID, "employee_schedules")
	if eid := c.Query("employee_id"); eid != "" {
		q = q.Where("employee_id = ?", eid)
	}
	if err := q.Order("day_of_week ASC").Find(&schedules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error loading schedules"})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		EmployeeID string `json:"employee_id" binding:"required"`
		DayOfWeek  int    `json:"day_of_week" binding:"required"`
		ShiftName  string `json:"shift_name"`
		StartTime  string `json:"start_time" binding:"required"`
		EndTime    string `json:"end_time" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	sched := domain.EmployeeSchedule{
		EmployeeID: req.EmployeeID,
		ClientID:   uc.ClientID,
		DayOfWeek:  req.DayOfWeek,
		ShiftName:  req.ShiftName,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
	}
	if err := h.DB.TT(uc.ClientID, "employee_schedules").Create(&sched).Error; err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error creating schedule"})
		return
	}
	c.JSON(http.StatusCreated, sched)
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	var req struct {
		DayOfWeek *int    `json:"day_of_week"`
		ShiftName *string `json:"shift_name"`
		StartTime *string `json:"start_time"`
		EndTime   *string `json:"end_time"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	updates := make(map[string]interface{})
	if req.DayOfWeek != nil { updates["day_of_week"] = *req.DayOfWeek }
	if req.ShiftName != nil { updates["shift_name"] = *req.ShiftName }
	if req.StartTime != nil { updates["start_time"] = *req.StartTime }
	if req.EndTime != nil { updates["end_time"] = *req.EndTime }
	result := h.DB.TT(uc.ClientID, "employee_schedules").Where("id = ?", c.Param("id")).Updates(updates)
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "schedule not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "schedule updated"})
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	uc := middleware.GetUserContext(c)
	result := h.DB.TT(uc.ClientID, "employee_schedules").Where("id = ?", c.Param("id")).Delete(&domain.EmployeeSchedule{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "schedule not found"})
		return
	}
	c.JSON(http.StatusOK, dto.MessageResponse{Message: "schedule deleted"})
}
