from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from jose import JWTError, jwt
from pydantic import ValidationError

from app.api.auth import login, register_user
from app.api.deps import get_current_user
from app.core.config import Settings, settings
from app.core.security import ALGORITHM, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate


def test_registration_rejects_client_supplied_role():
    """Kullanıcı kayıt sırasında kendisine admin rolü verememeli."""
    with pytest.raises(ValidationError):
        UserCreate(
            email="user@example.com",
            full_name="Test User",
            password="strong-password",
            role="admin",
        )


def test_registration_rejects_short_password():
    """Sekiz karakterden kısa parolalar reddedilmeli."""
    with pytest.raises(ValidationError):
        UserCreate(
            email="user@example.com",
            password="short",
        )


def test_registration_rejects_password_over_bcrypt_limit():
    """Bcrypt'in 72 bayt sınırını aşan parolalar reddedilmeli."""
    with pytest.raises(ValidationError):
        UserCreate(
            email="user@example.com",
            password="ş" * 37,
        )


def test_register_always_creates_viewer():
    """Yeni kullanıcı, istemciden bağımsız olarak viewer oluşturulmalı."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    user_in = UserCreate(
        email="user@example.com",
        full_name="Test User",
        password="strong-password",
    )

    created_user = register_user(user_in, db)

    assert created_user.role == "viewer"
    assert created_user.is_active is True
    db.add.assert_called_once_with(created_user)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(created_user)


def test_access_token_uses_configured_secret_and_user_id():
    """JWT, environment secret'ıyla imzalanmalı ve kullanıcı ID'si taşımalı."""
    token = create_access_token(
        {
            "sub": "42",
            "role": "viewer",
        }
    )

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[ALGORITHM],
    )

    assert payload["sub"] == "42"
    assert payload["role"] == "viewer"

    with pytest.raises(JWTError):
        jwt.decode(
            token,
            "wrong-secret",
            algorithms=[ALGORITHM],
        )


def test_current_user_rejects_inactive_account():
    """Pasif kullanıcı geçerli token'a sahip olsa bile reddedilmeli."""
    inactive_user = User(
        id=42,
        email="user@example.com",
        is_active=False,
    )

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = inactive_user

    token = create_access_token(
        {
            "sub": "42",
            "role": "viewer",
        }
    )

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(token, db)

    assert exc_info.value.status_code == 401


def test_login_rejects_inactive_account():
    """Pasif kullanıcı doğru giriş bilgileriyle de oturum açamamalı."""
    inactive_user = User(
        id=42,
        email="user@example.com",
        hashed_password="unused",
        is_active=False,
    )

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = inactive_user

    form_data = MagicMock()
    form_data.username = "user@example.com"
    form_data.password = "strong-password"

    with pytest.raises(HTTPException) as exc_info:
        login(form_data, db)

    assert exc_info.value.status_code == 401


def test_settings_reject_short_secret():
    """JWT secret en az 32 karakter olmalı."""
    with pytest.raises(ValidationError):
        Settings(
            DATABASE_URL="sqlite+pysqlite:///:memory:",
            SECRET_KEY="too-short",
            GROQ_API_KEY="gsk-dummy-key",
        )