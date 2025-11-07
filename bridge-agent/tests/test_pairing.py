import asyncio

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from bridge_agent.main import BridgeAgent


@pytest.mark.asyncio
async def test_pairing_cycle(tmp_path):
    agent = BridgeAgent(config={"cameras": []}, output_root=tmp_path)
    server = TestServer(agent.app)
    client = TestClient(server)
    await client.start_server()

    try:
        response = await client.get("/pairing-code")
        assert response.status == 200
        payload = await response.json()
        token_response = await client.post("/api/v1/pair", json={"pair_code": payload["pairCode"]})
        assert token_response.status == 200
        token_payload = await token_response.json()
        assert "token" in token_payload
    finally:
        await client.close()
        await server.close()
        await agent.shutdown()
