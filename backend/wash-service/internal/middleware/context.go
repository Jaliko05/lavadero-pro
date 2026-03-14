package middleware

import "github.com/gin-gonic/gin"

type UserContext struct {
	UserID   string
	ClientID string
	Email    string
	Roles    []string
}

func (u *UserContext) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

func (u *UserContext) IsAdmin() bool {
	return u.HasRole("admin") || u.HasRole("super_admin")
}

const userContextKey = "user_context"

func SetUserContext(c *gin.Context, uc *UserContext) {
	c.Set(userContextKey, uc)
}

func GetUserContext(c *gin.Context) *UserContext {
	val, exists := c.Get(userContextKey)
	if !exists {
		return nil
	}
	uc, ok := val.(*UserContext)
	if !ok {
		return nil
	}
	return uc
}

func GetClientID(c *gin.Context) string {
	if uc := GetUserContext(c); uc != nil {
		return uc.ClientID
	}
	return c.GetHeader("X-Client-ID")
}
