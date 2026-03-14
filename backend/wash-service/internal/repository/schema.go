package repository

import (
	"fmt"
	"strings"
)

// SchemaName returns the PostgreSQL schema name for a tenant.
func SchemaName(clientID string) string {
	return fmt.Sprintf("client_%s", clientID)
}

// ClientIDFromReference extracts the client_id from a payment reference.
// Reference format: "clientID__paymentID"
func ClientIDFromReference(reference string) string {
	parts := strings.SplitN(reference, "__", 2)
	if len(parts) == 2 {
		return parts[0]
	}
	return ""
}
