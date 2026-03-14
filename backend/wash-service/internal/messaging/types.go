package messaging

// --- Storage (Cloudflare R2) ---

// StorageRequest follows the Falcore R2 Service Integration Standard.
type StorageRequest struct {
	ClientID      string                 `json:"client_id"`
	Action        string                 `json:"action"`
	Key           string                 `json:"key"`
	Bucket        string                 `json:"bucket"`
	ContentType   string                 `json:"content_type,omitempty"`
	Expiry        int                    `json:"expiry,omitempty"`
	SourceService string                 `json:"source_service,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// StorageResponse follows the Falcore R2 Service Integration Standard.
type StorageResponse struct {
	Success       bool                   `json:"success"`
	Action        string                 `json:"action"`
	URL           string                 `json:"url,omitempty"`
	Message       string                 `json:"message"`
	ErrorCode     string                 `json:"error_code,omitempty"`
	ClientID      string                 `json:"client_id"`
	Key           string                 `json:"key"`
	Bucket        string                 `json:"bucket"`
	SourceService string                 `json:"source_service,omitempty"`
	Timestamp     string                 `json:"timestamp"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// --- Email ---

// EmailRequest follows the Falcore Email Service Standard.
type EmailRequest struct {
	ClientID      string                 `json:"client_id"`
	Type          string                 `json:"type"`
	To            string                 `json:"to"`
	Subject       string                 `json:"subject"`
	Data          map[string]interface{} `json:"data,omitempty"`
	Attachments   []EmailAttachment      `json:"attachments,omitempty"`
	SourceService string                 `json:"source_service,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

type EmailAttachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	URL         string `json:"url,omitempty"`
	Content     string `json:"content,omitempty"`
}
