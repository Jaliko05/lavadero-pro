package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware extracts user context from headers set by the API gateway.
// The gateway is responsible for JWT validation; this middleware only reads
// the forwarded claims: X-User-ID, X-Client-ID, X-Email, X-Roles.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		uc := extractUserFromHeaders(c)
		if uc == nil || uc.UserID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing user identity headers"})
			return
		}

		SetUserContext(c, uc)
		c.Next()
	}
}

// OptionalAuthMiddleware extracts user context from gateway headers if present,
// but does not abort if missing.
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		uc := extractUserFromHeaders(c)
		if uc != nil && uc.UserID != "" {
			SetUserContext(c, uc)
		}
		c.Next()
	}
}

// RequireRole checks if the authenticated user has at least one of the required roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uc := GetUserContext(c)
		if uc == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}

		for _, role := range roles {
			if uc.HasRole(role) {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}

func extractUserFromHeaders(c *gin.Context) *UserContext {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		return nil
	}

	uc := &UserContext{
		UserID:   userID,
		ClientID: c.GetHeader("X-Client-ID"),
		Email:    c.GetHeader("X-Email"),
	}

	if rolesHeader := c.GetHeader("X-Roles"); rolesHeader != "" {
		uc.Roles = strings.Split(rolesHeader, ",")
	}

	return uc
}
