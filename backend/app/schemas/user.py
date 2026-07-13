from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Ortak özellikler
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "viewer"

# Kayıt olurken frontend'den beklediğimiz veri yapısı
class UserCreate(UserBase):
    password: str

# API'den frontend'e döneceğimiz veri yapısı (Şifre asla dönülmez!)
class UserResponse(UserBase):
    id: int
    is_active: bool
    organization_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Login işlemi sonrası döneceğimiz token yapısı
class Token(BaseModel):
    access_token: str
    token_type: str