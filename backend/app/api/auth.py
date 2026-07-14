from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse

# API Router'ımızı tanımlıyoruz
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Yeni bir kullanıcı hesabı oluşturur."""

    # 1. Kullanıcının daha önce kayıt olup olmadığını kontrol et
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten sistemde kayıtlı.",
        )

    # 2. Şifreyi güvenlik modülümüzdeki fonksiyonla hash'le
    hashed_password = get_password_hash(user.password)

    # 3. Yeni kullanıcıyı veritabanı objesi olarak hazırla
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,  # Kayıt esnasında rolü kaydediyoruz
        is_active=True,  # Varsayılan olarak aktif ediyoruz
    )

    # 4. Veritabanına ekle ve kaydet
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Kullanıcı girişi yapar ve JWT access token döner."""

    # 1. Kullanıcıyı email adresiyle bul (OAuth2 formunda 'username' olarak gelir)
    user = db.query(User).filter(User.email == form_data.username).first()

    # 2. Kullanıcı yoksa veya şifre yanlışsa hata fırlat
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta adresi veya şifre.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Her şey doğruysa JWT Token üret
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Rol bilgisini token içerisine gömüyoruz
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}