"""Enforce non-null user roles.

Revision ID: c82d4f1a6b90
Revises: a31f2c9d7e40
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c82d4f1a6b90"
down_revision: Union[str, None] = "a31f2c9d7e40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Eski veya tutarsız kayıtlarda rol boşsa güvenli varsayılana çek.
    op.execute(
        sa.text(
            """
            UPDATE users
            SET role = 'viewer'
            WHERE role IS NULL
            """
        )
    )

    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        nullable=True,
    )