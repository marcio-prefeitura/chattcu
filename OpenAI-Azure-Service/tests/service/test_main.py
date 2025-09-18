import pytest
from fastapi.testclient import TestClient

from src.main import app


class TestMain:
    @pytest.fixture(scope="module")
    def test_client(self):
        client = TestClient(app)
        yield client

    def test_startup_event(self, test_client):
        response = test_client.get("/api/v1/docs")
        assert response.status_code == 200

    def test_shutdown_event(self, test_client):
        response = test_client.get("/api/v1/docs")
        assert response.status_code == 200
