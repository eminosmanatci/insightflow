# backend/app/api/deps.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

# Swagger'da sağ üstte çıkacak olan kilit (Authorize) butonunun nereye istek atacağını belirtir
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Gelen isteğin header'ındaki token'ı çözer ve kullanıcıyı bulur."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulanamadı veya token süresi doldu.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Token'ı çözüyoruz (decode)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Email'e göre kullanıcıyı veritabanından getir
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user