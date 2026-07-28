from types import SimpleNamespace
from unittest.mock import MagicMock

from app.services import ai_service


KPI_DATA = {
    "total_revenue": 41600.0,
    "transaction_count": 4,
    "average_transaction_value": 10400.0,
}

REGION_DATA = [
    {
        "region": "Marmara",
        "total_revenue": 20000.0,
    },
    {
        "region": "İç Anadolu",
        "total_revenue": 15000.0,
    },
]


def test_generate_business_insight_uses_demo_mode_without_real_key(
    monkeypatch,
):
    monkeypatch.setattr(
        ai_service.settings,
        "GROQ_API_KEY",
        "gsk-dummy-key",
    )

    groq_factory = MagicMock()
    monkeypatch.setattr(
        ai_service,
        "Groq",
        groq_factory,
    )

    result = ai_service.generate_business_insight(
        KPI_DATA,
        REGION_DATA,
    )

    assert "AI Demo Modu" in result
    assert "Gerçek analiz için Groq API Key giriniz." in result
    groq_factory.assert_not_called()


def test_generate_business_insight_calls_groq_with_analytics_data(
    monkeypatch,
):
    monkeypatch.setattr(
        ai_service.settings,
        "GROQ_API_KEY",
        "gsk-test-real-key",
    )

    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content="Gelir performansı güçlü.",
                ),
            ),
        ],
    )

    client = MagicMock()
    client.chat.completions.create.return_value = response

    groq_factory = MagicMock(
        return_value=client,
    )
    monkeypatch.setattr(
        ai_service,
        "Groq",
        groq_factory,
    )

    result = ai_service.generate_business_insight(
        KPI_DATA,
        REGION_DATA,
    )

    assert result == "Gelir performansı güçlü."

    groq_factory.assert_called_once_with(
        api_key="gsk-test-real-key",
    )

    client.chat.completions.create.assert_called_once()
    call_arguments = (
        client.chat.completions.create.call_args.kwargs
    )

    assert call_arguments["model"] == "llama-3.1-8b-instant"
    assert call_arguments["temperature"] == 0.7
    assert call_arguments["max_tokens"] == 300

    messages = call_arguments["messages"]

    assert len(messages) == 1
    assert messages[0]["role"] == "user"

    prompt = messages[0]["content"]

    assert "41600.0" in prompt
    assert "10400.0" in prompt
    assert "Marmara" in prompt
    assert "İç Anadolu" in prompt
    assert "Türkçe" in prompt


def test_generate_business_insight_returns_safe_message_on_groq_error(
    monkeypatch,
):
    monkeypatch.setattr(
        ai_service.settings,
        "GROQ_API_KEY",
        "gsk-test-real-key",
    )

    client = MagicMock()
    client.chat.completions.create.side_effect = RuntimeError(
        "provider unavailable",
    )

    monkeypatch.setattr(
        ai_service,
        "Groq",
        MagicMock(return_value=client),
    )

    result = ai_service.generate_business_insight(
        KPI_DATA,
        REGION_DATA,
    )

    assert "AI Analiz Hatası" in result
    assert "provider unavailable" in result


def test_generate_business_insight_handles_empty_provider_response(
    monkeypatch,
):
    monkeypatch.setattr(
        ai_service.settings,
        "GROQ_API_KEY",
        "gsk-test-real-key",
    )

    client = MagicMock()
    client.chat.completions.create.return_value = (
        SimpleNamespace(choices=[])
    )

    monkeypatch.setattr(
        ai_service,
        "Groq",
        MagicMock(return_value=client),
    )

    result = ai_service.generate_business_insight(
        KPI_DATA,
        REGION_DATA,
    )

    assert "AI Analiz Hatası" in result