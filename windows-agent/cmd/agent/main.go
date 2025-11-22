package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"time"

	"github.com/difaeai/windows-agent/internal/config"
	"github.com/difaeai/windows-agent/internal/logging"
	"github.com/difaeai/windows-agent/internal/uploader"
)

func main() {
	logger := logging.New()
	logger.Println("Agent started")
	cfg, err := config.LoadFromExecutable()
	if err != nil {
		logger.Fatalf("failed to load agent-config.json: %v", err)
	}

	logger.Printf("Loaded config for bridge %s", cfg.BridgeID)
	logger.Printf("Connecting to backend %s", cfg.BackendURL)
	logger.Printf("Testing RTSP URL at %s", cfg.RtspURL)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	exePath, _ := os.Executable()
	baseDir := filepath.Dir(exePath)
	workDir := filepath.Join(baseDir, "hls")
	upl := uploader.New(cfg.BackendURL, cfg.BridgeID, cfg.APIKey, logger)

	backoff := 5 * time.Second
	for ctx.Err() == nil {
		if err := runPipeline(ctx, cfg.RtspURL, workDir, upl, logger); err != nil && ctx.Err() == nil {
			logger.Printf("Pipeline error: %v", err)
			logger.Printf("Reconnecting to RTSP in %s", backoff)
			wait(ctx, backoff)
			backoff = nextBackoff(backoff)
			continue
		}

		backoff = 5 * time.Second
	}

	logger.Println("Agent shutting down")
}

func runPipeline(ctx context.Context, rtspURL, outputDir string, upl *uploader.Uploader, logger *log.Logger) error {
	_ = os.RemoveAll(outputDir)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return fmt.Errorf("failed to prepare output directory: %w", err)
	}

	manifestPath := filepath.Join(outputDir, "out.m3u8")
	args := []string{
		"-hide_banner",
		"-rtsp_transport", "tcp",
		"-i", rtspURL,
		"-an",
		"-c:v", "copy",
		"-f", "hls",
		"-hls_time", "2",
		"-hls_list_size", "5",
		"-hls_flags", "delete_segments",
		"-y",
		manifestPath,
	}

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stdout

	logger.Printf("Starting ffmpeg: ffmpeg %s", strings.Join(args, " "))
	logger.Printf("Attempting RTSP connection to %s", rtspURL)

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	monitorCtx, cancel := context.WithCancel(ctx)
	done := make(chan struct{})
	go func() {
		defer close(done)
		upl.MonitorOutput(monitorCtx, outputDir)
	}()

	err := cmd.Wait()
	cancel()
	<-done

	if ctx.Err() != nil {
		return ctx.Err()
	}

	if err != nil {
		logger.Printf("ffmpeg exited with error: %v", err)
		return err
	}

	return fmt.Errorf("ffmpeg exited unexpectedly")
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
