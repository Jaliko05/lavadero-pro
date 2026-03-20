package applog

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
)

// Logger provides structured logging following Falcore Logging Standard patterns.
// Can be replaced with falcore-log-package/v2 when available.
type Logger struct {
	level  Level
	fields map[string]string
}

type Level int

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
	LevelFatal
)

type ctxKey string

const (
	ctxClientID   ctxKey = "client_id"
	ctxRequestID  ctxKey = "request_id"
)

func NewFromEnv() *Logger {
	lvl := strings.ToLower(os.Getenv("LOG_LEVEL"))
	var level Level
	switch lvl {
	case "debug":
		level = LevelDebug
	case "warn":
		level = LevelWarn
	case "error":
		level = LevelError
	default:
		level = LevelInfo
	}
	return &Logger{level: level, fields: make(map[string]string)}
}

func WithClientID(ctx context.Context, clientID string) context.Context {
	return context.WithValue(ctx, ctxClientID, clientID)
}

func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, ctxRequestID, requestID)
}

func (l *Logger) WithContext(ctx context.Context) *Logger {
	nl := &Logger{level: l.level, fields: make(map[string]string)}
	for k, v := range l.fields {
		nl.fields[k] = v
	}
	if cid, ok := ctx.Value(ctxClientID).(string); ok && cid != "" {
		nl.fields["client_id"] = cid
	}
	if rid, ok := ctx.Value(ctxRequestID).(string); ok && rid != "" {
		nl.fields["request_id"] = rid
	}
	return nl
}

func (l *Logger) WithField(key, value string) *Logger {
	nl := &Logger{level: l.level, fields: make(map[string]string)}
	for k, v := range l.fields {
		nl.fields[k] = v
	}
	nl.fields[key] = value
	return nl
}

func (l *Logger) prefix() string {
	if len(l.fields) == 0 {
		return ""
	}
	parts := make([]string, 0, len(l.fields))
	for k, v := range l.fields {
		parts = append(parts, fmt.Sprintf("%s=%s", k, v))
	}
	return "[" + strings.Join(parts, " ") + "] "
}

func (l *Logger) Debug(msg string, args ...interface{}) {
	if l.level <= LevelDebug {
		log.Printf("DEBUG %s%s", l.prefix(), fmt.Sprintf(msg, args...))
	}
}

func (l *Logger) Info(msg string, args ...interface{}) {
	if l.level <= LevelInfo {
		log.Printf("INFO  %s%s", l.prefix(), fmt.Sprintf(msg, args...))
	}
}

func (l *Logger) Warn(msg string, args ...interface{}) {
	if l.level <= LevelWarn {
		log.Printf("WARN  %s%s", l.prefix(), fmt.Sprintf(msg, args...))
	}
}

func (l *Logger) Error(msg string, args ...interface{}) {
	if l.level <= LevelError {
		log.Printf("ERROR %s%s", l.prefix(), fmt.Sprintf(msg, args...))
	}
}

func (l *Logger) Fatal(msg string, args ...interface{}) {
	log.Fatalf("FATAL %s%s", l.prefix(), fmt.Sprintf(msg, args...))
}
