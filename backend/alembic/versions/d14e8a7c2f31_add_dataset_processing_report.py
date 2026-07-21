"""Add dataset processing report fields.

Revision ID: d14e8a7c2f31
Revises: c82d4f1a6b90
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d14e8a7c2f31"
down_revision: Union[str, None] = "c82d4f1a6b90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "datasets",
        sa.Column(
            "total_rows",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "datasets",
        sa.Column(
            "valid_rows",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "datasets",
        sa.Column(
            "invalid_rows",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "datasets",
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
    )
    op.add_column(
        "datasets",
        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Varsayılanlar yalnız mevcut kayıtları güvenli geçirmek için
    # kullanıldı. Yeni kayıtların değerlerini uygulama yönetecek.
    op.alter_column(
        "datasets",
        "total_rows",
        server_default=None,
    )
    op.alter_column(
        "datasets",
        "valid_rows",
        server_default=None,
    )
    op.alter_column(
        "datasets",
        "invalid_rows",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_column("datasets", "processed_at")
    op.drop_column("datasets", "error_message")
    op.drop_column("datasets", "invalid_rows")
    op.drop_column("datasets", "valid_rows")
    op.drop_column("datasets", "total_rows")