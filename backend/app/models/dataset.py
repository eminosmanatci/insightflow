from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    __table_args__ = (
        Index(
            "ux_datasets_organization_file_hash",
            "organization_id",
            "file_hash",
            unique=True,
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    name = Column(
        String,
        index=True,
        nullable=False,
    )
    status = Column(
        String,
        default="uploaded",
    )
    row_count = Column(
        Integer,
        default=0,
    )
    total_rows = Column(
        Integer,
        default=0,
        nullable=False,
    )
    valid_rows = Column(
        Integer,
        default=0,
        nullable=False,
    )
    invalid_rows = Column(
        Integer,
        default=0,
        nullable=False,
    )
    error_message = Column(
        Text,
        nullable=True,
    )
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id"),
    )
    file_hash = Column(
        String,
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    processed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    organization = relationship("Organization")
    records = relationship(
        "SalesRecord",
        back_populates="dataset",
        cascade="all, delete-orphan",
    )


class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    dataset_id = Column(
        Integer,
        ForeignKey("datasets.id"),
    )
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id"),
    )

    transaction_date = Column(DateTime)
    region = Column(
        String,
        index=True,
    )
    category = Column(
        String,
        index=True,
    )
    customer_name = Column(String)
    product_name = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)

    dataset = relationship(
        "Dataset",
        back_populates="records",
    )