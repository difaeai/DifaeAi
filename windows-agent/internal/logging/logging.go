package logging

import (
	"log"
	"os"
)

// New returns a logger configured for the agent.
func New() *log.Logger {
	return log.New(os.Stdout, "[difae-agent] ", log.LstdFlags|log.Lmicroseconds)
}
