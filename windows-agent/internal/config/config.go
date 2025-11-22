package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

const DefaultConfigFilename = "agent-config.json"

// AgentConfig holds runtime settings for the Windows agent.
type AgentConfig struct {
	BridgeID       string `json:"bridgeId"`
	APIKey         string `json:"apiKey"`
	RtspURL        string `json:"rtspUrl"`
	BackendURL     string `json:"backendUrl"`
	UploadBaseURL  string `json:"uploadBaseUrl,omitempty"`
	PollIntervalMs int    `json:"pollIntervalMs,omitempty"`
}

// ResolvePath returns the expected config path based on the executable location.
func ResolvePath(executable string) string {
	dir := filepath.Dir(executable)
	return filepath.Join(dir, DefaultConfigFilename)
}

// LoadFromExecutable loads the config that sits next to the executable binary.
func LoadFromExecutable() (AgentConfig, error) {
	exePath, err := os.Executable()
	if err != nil {
		return AgentConfig{}, fmt.Errorf("cannot locate executable: %w", err)
	}
	return Load(ResolvePath(exePath))
}

// Load reads and validates an agent config file.
func Load(path string) (AgentConfig, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return AgentConfig{}, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg AgentConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return AgentConfig{}, fmt.Errorf("failed to parse config: %w", err)
	}

	cfg = applyDefaults(cfg)

	if err := validate(cfg); err != nil {
		return AgentConfig{}, err
	}

	return cfg, nil
}

// Normalize applies defaults and validates a config received over the wire.
func Normalize(cfg AgentConfig) (AgentConfig, error) {
	cfg = applyDefaults(cfg)
	if err := validate(cfg); err != nil {
		return AgentConfig{}, err
	}

	return cfg, nil
}

// Save writes a config file to disk in a human-friendly format.
func Save(path string, cfg AgentConfig) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode config: %w", err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

// DefaultBackendURL returns the pairing base URL, preferring an environment override.
func DefaultBackendURL() string {
	if value := os.Getenv("DIFAE_BACKEND_URL"); value != "" {
		return value
	}

	return "https://difae-backend--difae-ai.us-east4.hosted.app"
}

func applyDefaults(cfg AgentConfig) AgentConfig {
	if cfg.UploadBaseURL == "" {
		cfg.UploadBaseURL = cfg.BackendURL
	}

	if cfg.PollIntervalMs == 0 {
		cfg.PollIntervalMs = 5000
	}

	return cfg
}

func validate(cfg AgentConfig) error {
	if cfg.BridgeID == "" {
		return errors.New("bridgeId is required in agent-config.json")
	}
	if cfg.APIKey == "" {
		return errors.New("apiKey is required in agent-config.json")
	}
	if cfg.RtspURL == "" {
		return errors.New("rtspUrl is required in agent-config.json")
	}
	if cfg.BackendURL == "" {
		return errors.New("backendUrl is required in agent-config.json")
	}
	if cfg.UploadBaseURL == "" {
		return errors.New("uploadBaseUrl is required in agent-config.json")
	}
	return nil
}
