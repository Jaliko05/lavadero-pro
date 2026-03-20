# LavaderoPro - SaaS de Gestión para Lavaderos de Vehículos

## Arquitectura

- **Backend**: Go 1.22, Gin, GORM, PostgreSQL, RabbitMQ - en `backend/wash-service/`
- **Frontend**: React 18, Vite 6, Tailwind CSS, Radix UI, Axios - en `frontend/`
- **Auth**: Split-token via Kong API Gateway (X-User-ID, X-Client-ID, X-Email, X-Roles)
- **Multi-tenant**: Schema-per-tenant con `DBAdapter.TT(clientID, tableName)`
- **Namespace**: `/v1/wash/` (Kong routing)

## Estructura Backend

```
backend/wash-service/
├── main.go                    → Config, DB, RabbitMQ, Gin setup
├── config/config.go           → Variables de entorno
├── internal/
│   ├── applog/               → Logger estructurado (patrón Falcore)
│   ├── domain/               → Modelos GORM (~30 entidades)
│   ├── dto/                  → Request/Response DTOs
│   ├── handler/              → HTTP handlers por módulo
│   ├── middleware/            → Auth (Kong headers), Context, CORS
│   ├── messaging/            → RabbitMQ producer + consumer + types
│   └── repository/           → DBAdapter + multi-tenant helpers
├── routes/routes.go          → Definición de todas las rutas
├── metrics/metrics.go        → Prometheus counters
└── Dockerfile                → Multi-stage build
```

## Módulos de Dominio

- **M1 - Gestión del Lavadero**: VehicleCategory, WashService, ServicePrice, ServicePackage, Turn, TurnService, TurnStatusHistory, TurnPhoto
- **M2 - POS/Tienda**: Product, Sale, SaleItem, Payment, CashRegister, Discount
- **M3 - Personal**: Employee, EmployeeAttendance, EmployeeSchedule, Payroll, PayrollItem, Commission
- **M4 - Finanzas**: Income, Expense, RecurringExpense, AccountReceivable
- **M5 - Inventario**: WashSupply, SupplyConsumption, Supplier, PurchaseOrder, PurchaseOrderItem, InventoryMovement
- **M6 - Clientes/Fidelización**: CustomerProfile, CustomerVehicle, LoyaltyConfig, LoyaltyTransaction, Rating, NotificationTemplate
- **M8 - Configuración**: WashConfig, Location

## Grupos de Rutas

- **Públicas** (`/v1/wash/`): display, turn-status, ratings, services
- **Auth** (`/v1/wash/`): turns, sales, payments, cash-register, customers, my/*
- **Admin** (`/v1/wash/admin/`): CRUD todos los módulos, dashboard, reportes, config
- **Super Admin** (`/v1/wash/super-admin/`): gestión de tenants

## Frontend

```
frontend/src/
├── api/           → Módulos Axios (19 archivos)
├── context/       → AuthContext (split-token)
├── components/    → auth/, shared/ (layouts, sidebar)
├── pages/         → 18 páginas por módulo
└── lib/           → utils (formatCurrency, formatDate, cn)
```

## Estándares Falcore

Los estándares se encuentran en `docs/standards/`. Este proyecto sigue:
- FALCORE_REST_API_STRUCTURE (estructura canonical)
- FALCORE_KONG_GATEWAY_STANDARD (auth via headers)
- FALCORE_MESSAGING_SERVICE_STANDARD (RabbitMQ producer/consumer)
- FALCORE_LOGGING_STANDARD (logger estructurado en internal/applog/)
- FALCORE_DEPLOYMENT_STANDARD (Dockerfile multi-stage)
- FALCORE_MULTI_TENANT_STANDARD (schema-per-tenant)

## Comandos

```bash
# Backend
cd backend/wash-service && go build ./...
cd backend/wash-service && go run main.go

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
```

## Variables de Entorno

### Backend (.env)
```
PORT=8082
DB_CONN=postgres://user:pass@localhost:5432/wash_db?sslmode=disable
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_AUTH_API_URL=http://localhost:8080
VITE_WASH_API_URL=http://localhost:8082
VITE_CLIENT_ID=tenant-uuid
```
