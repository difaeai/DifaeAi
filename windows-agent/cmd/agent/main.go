package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"time"

	"github.com/difaeai/windows-agent/internal/bridge"
	"github.com/difaeai/windows-agent/internal/config"
	"github.com/difaeai/windows-agent/internal/rtsp"
)

func main() {
	logger := log.New(os.Stdout, "[difae-agent] ", log.LstdFlags|log.Lmicroseconds)
	logger.Println("Agent started")

	exePath, err := os.Executable()
	if err != nil {
		logger.Fatalf("failed to determine executable path: %v", err)
	}

	cfgPath := config.ResolvePath(filepath.Clean(exePath))
	cfg, err := config.Load(cfgPath)
	if err != nil {
		logger.Fatalf("failed to load config: %v", err)
	}

	logger.Printf("Loaded bridge %s", cfg.BridgeID)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	uploader := bridge.NewUploader(cfg.BackendURL, cfg.APIKey, cfg.BridgeID, logger)
	rtspClient := rtsp.NewClient(cfg.RtspURL, logger)

	retry := 5 * time.Second

	for ctx.Err() == nil {
		if err := uploader.Connect(ctx); err != nil {
			logger.Printf("Reconnect in %s: %v", retry, err)
			wait(ctx, retry)
			retry = nextBackoff(retry)
			continue
		}

		retry = 5 * time.Second

		err := rtspClient.Stream(ctx, func(frame []byte) {
			if sendErr := uploader.SendFrame(ctx, frame); sendErr != nil && ctx.Err() == nil {
				logger.Printf("Send error: %v", sendErr)
			}
		})

		if ctx.Err() != nil {
			break
		}

		logger.Printf("Stream ended: %v", err)
		logger.Printf("Reconnecting in %s", retry)
		wait(ctx, retry)
		retry = nextBackoff(retry)
	}

	logger.Println("Agent shutting down")
}

func wait(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}

func nextBackoff(current time.Duration) time.Duration {
	next := current * 2
	if next > 1*time.Minute {
		return 1 * time.Minute
	}
	if next < 5*time.Second {
		return 5 * time.Second
	}
	return next
}
