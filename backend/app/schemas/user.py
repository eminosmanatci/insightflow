from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Ortak Özellikler ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "viewer"

# --- Kayıt Olurken Beklenen Veri Yapısı ---
class UserCreate(UserBase):
    password: str

# --- API'den Dönecek Güvenli Veri Yapısı (Şifresiz) ---
class UserResponse(UserBase):
    id: int
    is_active: bool
    organization_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Login Sonrası Dönecek Token Yapısı ---
class Token(BaseModel):
    access_token: str
    token_type: str