from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationResponse

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # GÜVENLİK KAPISI: Sadece giriş yapanlar erişebilir
):
    # 1. Kullanıcının zaten bir şirketi varsa engelle (MVP aşamasında 1 kullanıcı 1 şirket kurgusu)
    if current_user.organization_id:
        raise HTTPException(
            status_code=400, 
            detail="Zaten bir şirkete bağlısınız."
        )

    # 2. Şirketi veritabanına kaydet
    new_org = Organization(name=org_in.name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    # 3. Kullanıcıyı bu şirkete bağla ve yetkisini admin yap
    current_user.organization_id = new_org.id
    current_user.role = "admin"
    db.commit()
    db.refresh(current_user)

    return new_org

@router.get("/me", response_model=OrganizationResponse)
def get_my_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının bağlı olduğu şirketin bilgilerini getirir."""
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="Bağlı olduğunuz bir şirket bulunamadı.")
    
    return current_user.organization