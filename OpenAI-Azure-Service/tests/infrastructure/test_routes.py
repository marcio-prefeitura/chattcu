import pytest
from fastapi.testclient import TestClient

from src.infrastructure.routes import router as api_router

client = TestClient(api_router)


@pytest.mark.parametrize(
    "url, expected_prefix",
    [
        ("/api/health", "/api/health"),
        ("/api/v1/auth", "/api/v1/auth"),
        ("/api/v1/storage", "/api/v1/storage"),
        ("/api/v1/share", "/api/v1/share"),
        ("/api/v1/segedam", "/api/v1/segedam"),
    ],
)
def test_route_prefix(url, expected_prefix):

    response = client.get(url)
    if expected_prefix in url:
        assert response.status_code == 404
    else:
        assert response.status_code != 404


@pytest.mark.parametrize(
    "url, expected_status_code",
    [
        (
            "/api/health",
            404,
        ),
        ("/api/v1/auth", 404),
        ("/api/v1/storage", 404),
        ("/api/v1/share", 404),
        ("/api/v1/segedam", 404),
    ],
)
def test_routes(url, expected_status_code):
    response = client.get(url)
    assert response.status_code == expected_status_code
