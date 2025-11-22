package bridge

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"
)

// Uploader is a placeholder transport that pretends to stream frames to the backend.
type Uploader struct {
	backendURL string
	apiKey     string
	bridgeID   string
	logger     *log.Logger
	httpClient *http.Client
}

func NewUploader(backendURL, apiKey, bridgeID string, logger *log.Logger) *Uploader {
	return &Uploader{
		backendURL: backendURL,
		apiKey:     apiKey,
		bridgeID:   bridgeID,
		logger:     logger,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Connect simulates establishing a persistent connection to the backend.
func (u *Uploader) Connect(ctx context.Context) error {
	if u.backendURL == "" {
		return errors.New("backend URL is empty")
	}

	u.logger.Printf("Connected to backend at %s", u.backendURL)
	return nil
}

// SendFrame is a stub that would normally push encoded video to the backend.
func (u *Uploader) SendFrame(ctx context.Context, frame []byte) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
		u.logger.Printf("Sending frame for bridge %s (%d bytes)", u.bridgeID, len(frame))
		return nil
	}
}
