package bridge

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

// Uploader pushes playlist and segment files to the backend using the existing bridge upload protocol.
type Uploader struct {
	backendURL string
	apiKey     string
	bridgeID   string
	cameraID   string
	logger     *log.Logger
	client     *http.Client
}

func NewUploader(backendURL, apiKey, bridgeID, cameraID string, logger *log.Logger) *Uploader {
	return &Uploader{
		backendURL: strings.TrimRight(backendURL, "/"),
		apiKey:     apiKey,
		bridgeID:   bridgeID,
		cameraID:   cameraID,
		logger:     logger,
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (u *Uploader) upload(ctx context.Context, path string, fileName string, content []byte) error {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	if err := writer.WriteField("bridge_id", u.bridgeID); err != nil {
		return err
	}
	if err := writer.WriteField("camera_id", u.cameraID); err != nil {
		return err
	}

	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return err
	}

	if _, err := io.Copy(part, bytes.NewReader(content)); err != nil {
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, path, body)
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("x-api-key", u.apiKey)
	req.Header.Set("x-bridge-id", u.bridgeID)

	resp, err := u.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("upload failed: status=%d body=%s", resp.StatusCode, string(b))
	}

	return nil
}

func (u *Uploader) UploadPlaylist(ctx context.Context, fileName string, content []byte) error {
	url := fmt.Sprintf("%s/api/bridge/upload-file", u.backendURL)
	return u.upload(ctx, url, fileName, content)
}

func (u *Uploader) UploadSegment(ctx context.Context, fileName string, content []byte) error {
	url := fmt.Sprintf("%s/api/bridge/upload", u.backendURL)
	return u.upload(ctx, url, fileName, content)
}
