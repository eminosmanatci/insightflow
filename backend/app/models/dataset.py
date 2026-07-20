from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed
    row_count = Column(Integer, default=0)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    # --- YENİ EKLENEN SÜTUN ---
    file_hash = Column(String, index=True, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization")
    records = relationship("SalesRecord", back_populates="dataset", cascade="all, delete-orphan")

class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    # Analitik için gerekli iş verileri
    transaction_date = Column(DateTime)
    region = Column(String, index=True)
    category = Column(String, index=True)
    customer_name = Column(String)
    product_name = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    dataset = relationship("Dataset", back_populates="records")