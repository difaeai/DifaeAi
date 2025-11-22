package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/difaeai/windows-agent/internal/config"
)

// ErrInvalidPairCode indicates the backend rejected the supplied pairing code.
var ErrInvalidPairCode = errors.New("invalid pair code")

// Client handles lightweight API calls to the backend.
type Client struct {
	baseURL string
	http    *http.Client
}

// New returns a backend API client.
func New(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		http: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

type pairRequest struct {
	PairCode     string `json:"pairCode"`
	AgentVersion string `json:"agentVersion,omitempty"`
	MachineID    string `json:"machineId,omitempty"`
}

// Pair exchanges a code for the full bridge configuration.
func (c *Client) Pair(pairCode, agentVersion, machineID string) (config.AgentConfig, error) {
	payload := pairRequest{
		PairCode:     pairCode,
		AgentVersion: agentVersion,
		MachineID:    machineID,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return config.AgentConfig{}, fmt.Errorf("encode payload: %w", err)
	}

	endpoint := fmt.Sprintf("%s/api/bridge/pair", c.baseURL)
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return config.AgentConfig{}, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return config.AgentConfig{}, fmt.Errorf("pair request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusBadRequest {
		return config.AgentConfig{}, ErrInvalidPairCode
	}

	if resp.StatusCode >= 300 {
		return config.AgentConfig{}, fmt.Errorf("pair request failed: %s", resp.Status)
	}

	var cfg config.AgentConfig
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return config.AgentConfig{}, fmt.Errorf("decode response: %w", err)
	}

	normalized, err := config.Normalize(cfg)
	if err != nil {
		return config.AgentConfig{}, err
	}

	return normalized, nil
}
