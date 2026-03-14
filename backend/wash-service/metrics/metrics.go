package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	TurnsCreated = promauto.NewCounter(prometheus.CounterOpts{
		Name: "wash_turns_created_total",
		Help: "Total number of turns created",
	})

	TurnsCompleted = promauto.NewCounter(prometheus.CounterOpts{
		Name: "wash_turns_completed_total",
		Help: "Total number of turns completed (delivered)",
	})

	SalesTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "wash_sales_total",
		Help: "Total number of sales",
	})

	RevenueTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "wash_revenue_total",
		Help: "Total revenue in COP",
	}, []string{"payment_method"})
)
