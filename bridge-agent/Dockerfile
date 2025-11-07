FROM python:3.11-slim AS base
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY bridge-agent/bridge_agent /app/bridge_agent
COPY bridge-agent/pyproject.toml /app/pyproject.toml
COPY bridge-agent/setup.cfg /app/setup.cfg
RUN pip install --upgrade pip && pip install .
COPY sample-configs/bridge-agent.yaml /app/config/bridge-agent.yaml

EXPOSE 8787

CMD ["camera-bridge-agent", "--config", "/app/config/bridge-agent.yaml"]
