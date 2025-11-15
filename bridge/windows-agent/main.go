package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	configFileName       = "agent-config.json"
	logFileName          = "windows-agent.log"
	autoStartMarker      = ".auto-start-registered"
	scheduledTaskName    = "DifaeCameraBridge"
	defaultRelayEndpoint = "/api/bridge/relay"
	defaultFfmpegPath    = "ffmpeg"
	defaultRtspPort      = 554
)

type agentConfig struct {
	BridgeID      string       `json:"bridgeId"`
	BackendURL    string       `json:"backendUrl"`
	RelayEndpoint string       `json:"relayEndpoint"`
	APIKey        string       `json:"apiKey"`
	Camera        cameraConfig `json:"camera"`
	Ffmpeg        ffmpegConfig `json:"ffmpeg"`
}

type cameraConfig struct {
	Host       string `json:"host"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	RtspPort   int    `json:"rtspPort"`
	StreamPath string `json:"streamPath"`
	RtspURL    string `json:"rtspUrl"`
}

type ffmpegConfig struct {
	Path          string   `json:"path"`
	RtspTransport string   `json:"rtspTransport"`
	ExtraArgs     []string `json:"extraArguments"`
}

type runtimeConfig struct {
	raw     agentConfig
	relay   string
	rtspURL string
}

func main() {
	exePath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to determine executable path: %v\n", err)
		os.Exit(1)
	}
	exeDir := filepath.Dir(exePath)

	logFile, err := os.OpenFile(filepath.Join(exeDir, logFileName), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to open log file: %v\n", err)
		os.Exit(1)
	}
	defer logFile.Close()

	logger := log.New(io.MultiWriter(os.Stdout, logFile), "", log.Ldate|log.Ltime|log.Lmicroseconds)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	if err := ensureAutoStart(ctx, logger, exePath, exeDir); err != nil {
		logger.Printf("WARN: auto-start registration failed: %v", err)
	}

	configPath := filepath.Join(exeDir, configFileName)
	backoff := 5 * time.Second

	for ctx.Err() == nil {
		cfg, err := loadConfig(configPath)
		if err != nil {
			logger.Printf("ERROR: %v", err)
			backoff = nextBackoff(backoff)
			waitWithContext(ctx, backoff)
			continue
		}

		logger.Printf("Bridge ID: %s", cfg.raw.BridgeID)
		logger.Printf("Backend relay: %s", cfg.relay)
		logger.Printf("RTSP source: %s", maskPassword(cfg.rtspURL))

		if err := runSession(ctx, cfg, logger); err != nil {
			if errors.Is(err, context.Canceled) {
				break
			}
			logger.Printf("ERROR: %v", err)
			backoff = nextBackoff(backoff)
			waitWithContext(ctx, backoff)
			continue
		}

		backoff = 5 * time.Second
	}

	logger.Printf("Shutting down")
}

func loadConfig(path string) (runtimeConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return runtimeConfig{}, fmt.Errorf("failed to read %s: %w", configFileName, err)
	}

	var cfg agentConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return runtimeConfig{}, fmt.Errorf("failed to parse %s: %w", configFileName, err)
	}

	applyDefaults(&cfg)
	applyEnvOverrides(&cfg)

	relay, err := resolveRelayURL(cfg.BackendURL, cfg.RelayEndpoint)
	if err != nil {
		return runtimeConfig{}, err
	}

	rtsp := buildRtspURL(cfg.Camera)
	cfg.Camera.RtspURL = rtsp

	return runtimeConfig{raw: cfg, relay: relay, rtspURL: rtsp}, nil
}

func applyDefaults(cfg *agentConfig) {
	if strings.TrimSpace(cfg.RelayEndpoint) == "" {
		cfg.RelayEndpoint = defaultRelayEndpoint
	}

	if strings.TrimSpace(cfg.Ffmpeg.Path) == "" {
		cfg.Ffmpeg.Path = defaultFfmpegPath
	}

	if cfg.Camera.RtspPort == 0 {
		cfg.Camera.RtspPort = defaultRtspPort
	}

	if strings.TrimSpace(cfg.Ffmpeg.RtspTransport) == "" {
		cfg.Ffmpeg.RtspTransport = "tcp"
	}

	if cfg.Ffmpeg.ExtraArgs == nil {
		cfg.Ffmpeg.ExtraArgs = []string{}
	}
}

func applyEnvOverrides(cfg *agentConfig) {
	if v := strings.TrimSpace(os.Getenv("BRIDGE_ID")); v != "" {
		cfg.BridgeID = v
	}
	if v := strings.TrimSpace(os.Getenv("BACKEND_URL")); v != "" {
		cfg.BackendURL = v
	}
	if v := strings.TrimSpace(os.Getenv("RELAY_ENDPOINT")); v != "" {
		cfg.RelayEndpoint = v
	}
	if v := strings.TrimSpace(os.Getenv("BRIDGE_API_KEY")); v != "" {
		cfg.APIKey = v
	}

	camera := &cfg.Camera
	if v := strings.TrimSpace(os.Getenv("RTSP_URL")); v != "" {
		camera.RtspURL = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_USERNAME")); v != "" {
		camera.Username = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_PASSWORD")); v != "" {
		camera.Password = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_HOST")); v != "" {
		camera.Host = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_PATH")); v != "" {
		camera.StreamPath = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_PORT")); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			camera.RtspPort = port
		}
	}

	if v := strings.TrimSpace(os.Getenv("FFMPEG_PATH")); v != "" {
		cfg.Ffmpeg.Path = v
	}
	if v := strings.TrimSpace(os.Getenv("RTSP_TRANSPORT")); v != "" {
		cfg.Ffmpeg.RtspTransport = v
	}
}

func resolveRelayURL(base, endpoint string) (string, error) {
	endpoint = strings.TrimSpace(endpoint)
	if endpoint == "" {
		endpoint = defaultRelayEndpoint
	}

	if u, err := url.Parse(endpoint); err == nil && u.IsAbs() {
		return u.String(), nil
	}

	baseURL, err := url.Parse(base)
	if err != nil {
		return "", fmt.Errorf("invalid backendUrl '%s'", base)
	}

	u, err := baseURL.Parse(endpoint)
	if err != nil {
		return "", fmt.Errorf("invalid relayEndpoint '%s'", endpoint)
	}

	return u.String(), nil
}

func buildRtspURL(camera cameraConfig) string {
	if strings.TrimSpace(camera.RtspURL) != "" {
		return camera.RtspURL
	}

	path := camera.StreamPath
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	u := &url.URL{
		Scheme: "rtsp",
		Host:   fmt.Sprintf("%s:%d", camera.Host, camera.RtspPort),
		Path:   path,
	}

	if camera.Username != "" || camera.Password != "" {
		u.User = url.UserPassword(camera.Username, camera.Password)
	}

	return u.String()
}

func runSession(ctx context.Context, cfg runtimeConfig, logger *log.Logger) error {
	args := []string{"-nostdin", "-rtsp_transport", cfg.raw.Ffmpeg.RtspTransport}
	if len(cfg.raw.Ffmpeg.ExtraArgs) > 0 {
		args = append(args, cfg.raw.Ffmpeg.ExtraArgs...)
	}
	args = append(args, "-i", cfg.rtspURL, "-c", "copy", "-f", "mpegts", "pipe:1")

	cmd := exec.CommandContext(ctx, cfg.raw.Ffmpeg.Path, args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to capture ffmpeg stdout: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to capture ffmpeg stderr: %w", err)
	}

	logger.Printf("Launching FFmpeg: %s %s", cfg.raw.Ffmpeg.Path, strings.Join(args, " "))

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		streamFfmpegStderr(stderr, logger)
	}()

	requestCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	req, err := http.NewRequestWithContext(requestCtx, http.MethodPost, cfg.relay, io.NopCloser(stdout))
	if err != nil {
		cmd.Process.Kill()
		wg.Wait()
		return fmt.Errorf("failed to construct relay request: %w", err)
	}

	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Bridge-Id", cfg.raw.BridgeID)
	req.Header.Set("Accept-Encoding", "identity")
	req.TransferEncoding = []string{"chunked"}
	if strings.TrimSpace(cfg.raw.APIKey) != "" {
		req.Header.Set("X-Api-Key", cfg.raw.APIKey)
	}

	client := &http.Client{Timeout: 0}

	resp, err := client.Do(req)
	if err != nil {
		cmd.Process.Kill()
		wg.Wait()
		return fmt.Errorf("failed to send relay request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		cmd.Process.Kill()
		wg.Wait()
		return fmt.Errorf("relay endpoint %s rejected the stream with %d: %s", cfg.relay, resp.StatusCode, strings.TrimSpace(string(body)))
	}

	logger.Printf("Relay accepted stream (status %d)", resp.StatusCode)

	waitErr := cmd.Wait()
	wg.Wait()
	io.Copy(io.Discard, resp.Body)

	if ctx.Err() != nil {
		return context.Canceled
	}

	if waitErr != nil {
		var exitErr *exec.ExitError
		if errors.As(waitErr, &exitErr) {
			return fmt.Errorf("ffmpeg exited with code %d", exitErr.ExitCode())
		}
		return fmt.Errorf("ffmpeg exited: %w", waitErr)
	}

	return nil
}

func streamFfmpegStderr(r io.Reader, logger *log.Logger) {
	scanner := bufio.NewScanner(r)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1<<20)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			logger.Printf("ffmpeg: %s", line)
		}
	}
}

func waitWithContext(ctx context.Context, d time.Duration) {
	if d <= 0 {
		d = 5 * time.Second
	}

	timer := time.NewTimer(d)
	defer timer.Stop()

	select {
	case <-ctx.Done():
	case <-timer.C:
	}
}

func nextBackoff(current time.Duration) time.Duration {
	next := current * 2
	if next > 5*time.Minute {
		next = 5 * time.Minute
	}
	if next < 5*time.Second {
		next = 5 * time.Second
	}
	return next
}

func maskPassword(rtsp string) string {
	if rtsp == "" {
		return rtsp
	}
	u, err := url.Parse(rtsp)
	if err != nil {
		return rtsp
	}
	if u.User != nil {
		username := u.User.Username()
		if username != "" {
			u.User = url.UserPassword(username, "****")
		}
	}
	return u.String()
}

func ensureAutoStart(ctx context.Context, logger *log.Logger, exePath, exeDir string) error {
	if runtime.GOOS != "windows" {
		return nil
	}

	marker := filepath.Join(exeDir, autoStartMarker)
	if _, err := os.Stat(marker); err == nil {
		return nil
	}

	info, err := os.Stat(exePath)
	if err != nil {
		return fmt.Errorf("cannot determine executable for auto-start: %w", err)
	}
	if info.IsDir() {
		return fmt.Errorf("executable path points to a directory")
	}

	args := []string{
		"/Create",
		"/TN", scheduledTaskName,
		"/TR", exePath,
		"/SC", "ONLOGON",
		"/RL", "HIGHEST",
		"/F",
	}

	cmd := exec.CommandContext(ctx, "schtasks", args...)
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard

	if err := cmd.Run(); err != nil {
		return err
	}

	if err := os.WriteFile(marker, []byte(time.Now().Format(time.RFC3339)), 0o644); err != nil {
		return err
	}

	logger.Printf("Registered scheduled task %s for auto-start", scheduledTaskName)
	return nil
}
