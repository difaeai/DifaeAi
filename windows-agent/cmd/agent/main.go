package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
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

	uploader := bridge.NewUploader(cfg.BackendURL, cfg.APIKey, cfg.BridgeID, cfg.CameraID, logger)
	outputDir := filepath.Join(filepath.Dir(cfgPath), "hls")
	pipeline := rtsp.NewPipeline(cfg.RtspURL, outputDir, logger)

	retry := 5 * time.Second

	for ctx.Err() == nil {
		if err := pipeline.Start(ctx); err != nil {
			logger.Printf("Failed to start pipeline: %v", err)
			logger.Printf("Retrying in %s", retry)
			wait(ctx, retry)
			retry = nextBackoff(retry)
			continue
		}

		retry = 5 * time.Second
		logger.Printf("Streaming RTSP %s -> backend %s", cfg.RtspURL, strings.TrimRight(cfg.BackendURL, "/"))

		monitorCtx, cancelMonitor := context.WithCancel(ctx)
		done := make(chan struct{})
		go func() {
			defer close(done)
			syncUploads(monitorCtx, pipeline, uploader, logger)
		}()

		err := pipeline.Wait()
		cancelMonitor()
		<-done

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

func syncUploads(ctx context.Context, pipeline *rtsp.Pipeline, uploader *bridge.Uploader, logger *log.Logger) {
	uploaded := make(map[string]time.Time)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			entries, err := os.ReadDir(pipeline.OutputDir())
			if err != nil {
				logger.Printf("Failed to read HLS output: %v", err)
				continue
			}

			for _, entry := range entries {
				if entry.IsDir() {
					continue
				}
				name := entry.Name()

				fullPath := filepath.Join(pipeline.OutputDir(), name)
				data, err := os.ReadFile(fullPath)
				if err != nil {
					logger.Printf("Read error for %s: %v", name, err)
					continue
				}

				if strings.HasSuffix(name, ".m3u8") {
					lastSent, ok := uploaded[name]
					mod := pipeline.LastModified(name)
					if !ok || mod.After(lastSent) {
						if err := uploader.UploadPlaylist(ctx, name, data); err != nil {
							logger.Printf("Playlist upload failed: %v", err)
						} else {
							uploaded[name] = mod
							logger.Printf("Uploaded playlist %s", name)
						}
					}
					continue
				}

				if !strings.HasSuffix(strings.ToLower(name), ".ts") {
					continue
				}

				if _, exists := uploaded[name]; exists {
					continue
				}

				if err := uploader.UploadSegment(ctx, name, data); err != nil {
					logger.Printf("Segment upload failed: %v", err)
					continue
				}
				uploaded[name] = time.Now()
				logger.Printf("Uploaded segment %s", name)
			}
		}
	}
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
