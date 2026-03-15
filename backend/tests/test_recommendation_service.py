import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.services.recommendation_service import RecommendationService
from app.models.dtos.recommendation_dto import RecommendationRequest

@pytest.fixture
def service():
    return RecommendationService()

@pytest.fixture
def base_request():
    return RecommendationRequest(
        location="Madrid",
        categories=["mexicano"],
        prices=[],
        include_unconfirmed_price=False,
        max_results=10,
        open_now=False,
        page_token=None
    )

@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_search_restaurants_basic(mock_post, service, base_request):
    # Mock response from Google
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "places": [
            {
                "id": "1",
                "displayName": {"text": "Restaurante A"},
                "formattedAddress": "Calle 123",
                "rating": 4.5,
                "userRatingCount": 100
            }
        ]
    }
    mock_post.return_value = mock_response

    result = await service.search_restaurants(base_request)

    assert "results" in result
    assert len(result["results"]) == 1
    assert result["results"][0]["name"] == "Restaurante A"
    
    # Verify payload
    _, kwargs = mock_post.call_args
    payload = kwargs["json"]
    assert "mexicano" in payload["textQuery"]
    assert "Madrid" in payload["textQuery"]
    assert payload["maxResultCount"] == 10

@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_search_restaurants_filters(mock_post, service, base_request):
    base_request.prices = ["PRICE_LEVEL_INEXPENSIVE"]
    base_request.open_now = True
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"places": []}
    mock_post.return_value = mock_response

    await service.search_restaurants(base_request)

    _, kwargs = mock_post.call_args
    payload = kwargs["json"]
    assert payload["priceLevels"] == ["PRICE_LEVEL_INEXPENSIVE"]
    assert payload["openNow"] is True

@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_bayesian_sorting(mock_post, service, base_request):
    # Definimos dos restaurantes:
    # A: 5 estrellas, 1 reseña
    # B: 4.8 estrellas, 1000 reseñas
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "places": [
            {
                "id": "A",
                "displayName": {"text": "Perfecto pero nuevo"},
                "rating": 5.0,
                "userRatingCount": 1
            },
            {
                "id": "B",
                "displayName": {"text": "Muy bueno y popular"},
                "rating": 4.8,
                "userRatingCount": 1000
            }
        ]
    }
    mock_post.return_value = mock_response

    result = await service.search_restaurants(base_request)
    results = result["results"]

    # Con la media bayesiana (umbral=10, media=3.5), el popular debe salir primero
    assert results[0]["id"] == "B"
    assert results[1]["id"] == "A"

@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_google_api_error(mock_post, service, base_request):
    mock_response = MagicMock()
    mock_response.status_code = 403
    mock_response.text = "Forbidden"
    mock_post.return_value = mock_response

    result = await service.search_restaurants(base_request)
    assert result == []
