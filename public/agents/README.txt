The Windows bridge agent executable (difae-bridge-windows.exe) must be uploaded manually and is **not** tracked in git.
You can host it at /public/agents/difae-bridge-windows.exe or an external download URL. The frontend expects a static
link (default https://myapp.com/downloads/difae-windows-agent.exe) and never builds the binary at runtime.
