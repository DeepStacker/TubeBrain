"""Add status_message to analyses

Revision ID: bdcf0fc06a02
Revises: 2322fda8d16c
Create Date: 2026-04-03 19:26:32.633181
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bdcf0fc06a02'
down_revision: Union[str, None] = '2322fda8d16c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    analyses_columns = {column["name"] for column in inspector.get_columns("analyses")}

    if "status_message" not in analyses_columns:
        op.add_column("analyses", sa.Column("status_message", sa.String(length=255), nullable=True))
    else:
        op.alter_column(
            "analyses",
            "status_message",
            existing_type=sa.TEXT(),
            type_=sa.String(length=255),
            existing_nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    analyses_columns = {column["name"] for column in inspector.get_columns("analyses")}

    if "status_message" in analyses_columns:
        op.alter_column(
            "analyses",
            "status_message",
            existing_type=sa.String(length=255),
            type_=sa.TEXT(),
            existing_nullable=True,
        )
