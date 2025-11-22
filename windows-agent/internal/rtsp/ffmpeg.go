package rtsp

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type Pipeline struct {
	rtspURL   string
	outputDir string
	logger    *log.Logger
	cmd       *exec.Cmd
}

func NewPipeline(rtspURL, outputDir string, logger *log.Logger) *Pipeline {
	return &Pipeline{rtspURL: rtspURL, outputDir: outputDir, logger: logger}
}

func (p *Pipeline) Start(ctx context.Context) error {
	if err := os.RemoveAll(p.outputDir); err != nil {
		return err
	}
	if err := os.MkdirAll(p.outputDir, 0o755); err != nil {
		return err
	}

	args := []string{
		"-hide_banner",
		"-rtsp_transport", "tcp",
		"-i", p.rtspURL,
		"-an",
		"-c:v", "copy",
		"-f", "hls",
		"-hls_time", "2",
		"-hls_list_size", "6",
		"-hls_flags", "delete_segments+append_list",
		filepath.Join(p.outputDir, "playlist.m3u8"),
	}

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	p.cmd = cmd

	p.logger.Printf("Starting ffmpeg for %s", p.rtspURL)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}
	return nil
}

func (p *Pipeline) Wait() error {
	if p.cmd == nil {
		return nil
	}
	err := p.cmd.Wait()
	if err != nil {
		return err
	}
	return nil
}

func (p *Pipeline) Alive() bool {
	if p.cmd == nil || p.cmd.Process == nil {
		return false
	}
	return p.cmd.ProcessState == nil
}

func (p *Pipeline) Stop() {
	if p.cmd == nil || p.cmd.Process == nil {
		return
	}
	_ = p.cmd.Process.Kill()
}

func (p *Pipeline) OutputDir() string {
	return p.outputDir
}

func (p *Pipeline) PlaylistPath() string {
	return filepath.Join(p.outputDir, "playlist.m3u8")
}

func (p *Pipeline) LastModified(name string) time.Time {
	info, err := os.Stat(filepath.Join(p.outputDir, name))
	if err != nil {
		return time.Time{}
	}
	return info.ModTime()
}
