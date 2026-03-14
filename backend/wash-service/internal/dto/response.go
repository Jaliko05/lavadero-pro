package dto

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

type DashboardStatsResponse struct {
	TotalVentas       float64 `json:"total_ventas"`
	TotalTurnos       int64   `json:"total_turnos"`
	TurnosHoy         int64   `json:"turnos_hoy"`
	TurnosEnCurso     int64   `json:"turnos_en_curso"`
	TurnosEsperando   int64   `json:"turnos_esperando"`
	TotalEmpleados    int64   `json:"total_empleados"`
	TotalClientes     int64   `json:"total_clientes"`
	VentasMes         float64 `json:"ventas_mes"`
	PromedioCalif     float64 `json:"promedio_calificacion"`
	ProductosSinStock int64   `json:"productos_sin_stock"`
	InsumosBajoStock  int64   `json:"insumos_bajo_stock"`
}

type RevenueDataPoint struct {
	Fecha string  `json:"fecha"`
	Total float64 `json:"total"`
	Count int64   `json:"count"`
}

type TurnsByStatusResponse struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type TopServiceResponse struct {
	ServiceID string  `json:"service_id"`
	Name      string  `json:"name"`
	Count     int     `json:"count"`
	Revenue   float64 `json:"revenue"`
}

type EmployeeRankingResponse struct {
	EmployeeID string  `json:"employee_id"`
	Name       string  `json:"name"`
	TurnsCount int     `json:"turns_count"`
	AvgRating  float64 `json:"avg_rating"`
}

type UploadURLResponse struct {
	UploadURL string `json:"upload_url"`
	FileURL   string `json:"file_url,omitempty"`
	Key       string `json:"key"`
}
