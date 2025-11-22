package rtsp

import (
	"context"
	"log"
	"time"
)

// Client simulates an RTSP reader. Replace with a real RTSP implementation as needed.
type Client struct {
	rtspURL string
	logger  *log.Logger
}

func NewClient(rtspURL string, logger *log.Logger) *Client {
	return &Client{rtspURL: rtspURL, logger: logger}
}

// Stream opens the RTSP feed and pushes dummy frames to the provided callback.
func (c *Client) Stream(ctx context.Context, onFrame func([]byte)) error {
	c.logger.Printf("RTSP stream opened: %s", c.rtspURL)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case t := <-ticker.C:
			frame := []byte("frame-" + t.Format(time.RFC3339Nano))
			onFrame(frame)
		}
	}
}
