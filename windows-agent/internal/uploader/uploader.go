package uploader

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Uploader pushes manifest + HLS segments to the backend.
type Uploader struct {
	backendURL string
	bridgeID   string
	apiKey     string
	client     *http.Client
	logger     *log.Logger
}

func New(backendURL, bridgeID, apiKey string, logger *log.Logger) *Uploader {
	return &Uploader{
		backendURL: strings.TrimRight(backendURL, "/"),
		bridgeID:   bridgeID,
		apiKey:     apiKey,
		logger:     logger,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// MonitorOutput scans an output directory for new playlists/segments and uploads them.
func (u *Uploader) MonitorOutput(ctx context.Context, outputDir string) {
	uploaded := make(map[string]time.Time)
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			entries, err := os.ReadDir(outputDir)
			if err != nil {
				u.logger.Printf("Failed to read output dir: %v", err)
				continue
			}

			for _, entry := range entries {
				if entry.IsDir() {
					continue
				}

				name := entry.Name()
				full := filepath.Join(outputDir, name)

				info, err := os.Stat(full)
				if err != nil {
					u.logger.Printf("Could not stat %s: %v", name, err)
					continue
				}

				// Upload manifest changes.
				if strings.HasSuffix(strings.ToLower(name), ".m3u8") {
					lastSent, ok := uploaded[name]
					if ok && !info.ModTime().After(lastSent) {
						continue
					}

					data, err := os.ReadFile(full)
					if err != nil {
						u.logger.Printf("Read manifest error: %v", err)
						continue
					}

					if err := u.UploadManifest(ctx, data); err != nil {
						u.logger.Printf("Manifest upload failed: %v", err)
						continue
					}

					uploaded[name] = info.ModTime()
					u.logger.Printf("Uploaded manifest %s", name)
					continue
				}

				// Upload new TS segments.
				if !strings.HasSuffix(strings.ToLower(name), ".ts") {
					continue
				}

				if _, ok := uploaded[name]; ok {
					continue
				}

				data, err := os.ReadFile(full)
				if err != nil {
					u.logger.Printf("Read segment error: %v", err)
					continue
				}

				if err := u.UploadSegment(ctx, name, data); err != nil {
					u.logger.Printf("Upload failed for %s: %v", name, err)
					continue
				}

				uploaded[name] = time.Now()
				u.logger.Printf("Uploading segment %s", name)
			}
		}
	}
}

func (u *Uploader) UploadManifest(ctx context.Context, data []byte) error {
	endpoint := fmt.Sprintf("%s/api/bridge-upload/manifest", u.backendURL)
	return u.doWithRetry(func() (*http.Request, error) {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/vnd.apple.mpegurl")
		u.addBridgeHeaders(req)
		return req, nil
	})
}

func (u *Uploader) UploadSegment(ctx context.Context, name string, data []byte) error {
	endpoint := fmt.Sprintf("%s/api/bridge-upload/segment", u.backendURL)
	return u.doWithRetry(func() (*http.Request, error) {
		body := &bytes.Buffer{}
		writer := multipart.NewWriter(body)

		part, err := writer.CreateFormFile("file", name)
		if err != nil {
			return nil, err
		}
		if _, err := io.Copy(part, bytes.NewReader(data)); err != nil {
			return nil, err
		}

		if err := writer.Close(); err != nil {
			return nil, err
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, body)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", writer.FormDataContentType())
		u.addBridgeHeaders(req)
		return req, nil
	})
}

func (u *Uploader) doWithRetry(build func() (*http.Request, error)) error {
	backoff := 2 * time.Second
	for attempts := 0; attempts < 5; attempts++ {
		req, err := build()
		if err != nil {
			return err
		}

		resp, err := u.client.Do(req)
		if err == nil && resp.StatusCode < 300 {
			_ = resp.Body.Close()
			return nil
		}

		if resp != nil {
			_ = resp.Body.Close()
		}

		u.logger.Printf("Upload failed, retrying... (%d)", attempts+1)
		time.Sleep(backoff)
		backoff = nextBackoff(backoff)
	}

	return fmt.Errorf("upload failed after retries")
}

func (u *Uploader) addBridgeHeaders(req *http.Request) {
	req.Header.Set("X-Bridge-Id", u.bridgeID)
	req.Header.Set("X-Bridge-Key", u.apiKey)
}

func nextBackoff(current time.Duration) time.Duration {
	next := current * 2
	if next > 30*time.Second {
		return 30 * time.Second
	}
	return next
}
