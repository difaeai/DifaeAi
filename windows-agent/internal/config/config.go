package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

const DefaultConfigFilename = "agent-config.json"

// AgentConfig represents the on-disk configuration consumed by the Windows agent.
type AgentConfig struct {
	BridgeID   string `json:"bridgeId"`
	APIKey     string `json:"apiKey"`
	RtspURL    string `json:"rtspUrl"`
	BackendURL string `json:"backendUrl"`
	CameraID   string `json:"cameraId"`
}

// ResolvePath returns the absolute path to the config file relative to the executable location.
func ResolvePath(executablePath string) string {
	dir := filepath.Dir(executablePath)
	return filepath.Join(dir, DefaultConfigFilename)
}

// Load reads and validates the configuration from disk.
func Load(path string) (AgentConfig, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return AgentConfig{}, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg AgentConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return AgentConfig{}, fmt.Errorf("failed to parse config: %w", err)
	}

	if err := validate(cfg); err != nil {
		return AgentConfig{}, err
	}

	return cfg, nil
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
	if cfg.CameraID == "" {
		cfg.CameraID = "camera"
	}
	return nil
}
