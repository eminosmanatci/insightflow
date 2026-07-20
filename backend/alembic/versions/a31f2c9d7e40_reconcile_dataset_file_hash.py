"""Reconcile dataset file hash schema.

Revision ID: a31f2c9d7e40
Revises: 60ce7dfc3279
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a31f2c9d7e40"
down_revision: Union[str, None] = "60ce7dfc3279"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


SINGLE_HASH_INDEX = "ix_datasets_file_hash"
UNIQUE_ORGANIZATION_HASH_INDEX = (
    "ux_datasets_organization_file_hash"
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    column_names = {
        column["name"]
        for column in inspector.get_columns("datasets")
    }

    # Mevcut geliştirme veritabanında create_all() tarafından
    # oluşturulmuş olabilir. Temiz veritabanında ise migration ekler.
    if "file_hash" not in column_names:
        op.add_column(
            "datasets",
            sa.Column(
                "file_hash",
                sa.String(),
                nullable=True,
            ),
        )

    # Kolon eklenmiş olabileceği için inspector'ı yenile.
    inspector = sa.inspect(bind)

    index_names = {
        index["name"]
        for index in inspector.get_indexes("datasets")
    }

    # Tek başına file_hash index'i tenant kapsamını korumaz.
    if SINGLE_HASH_INDEX in index_names:
        op.drop_index(
            SINGLE_HASH_INDEX,
            table_name="datasets",
        )

    if UNIQUE_ORGANIZATION_HASH_INDEX not in index_names:
        op.create_index(
            UNIQUE_ORGANIZATION_HASH_INDEX,
            "datasets",
            ["organization_id", "file_hash"],
            unique=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    index_names = {
        index["name"]
        for index in inspector.get_indexes("datasets")
    }

    if UNIQUE_ORGANIZATION_HASH_INDEX in index_names:
        op.drop_index(
            UNIQUE_ORGANIZATION_HASH_INDEX,
            table_name="datasets",
        )

    column_names = {
        column["name"]
        for column in sa.inspect(bind).get_columns("datasets")
    }

    if "file_hash" in column_names:
        op.drop_column("datasets", "file_hash")