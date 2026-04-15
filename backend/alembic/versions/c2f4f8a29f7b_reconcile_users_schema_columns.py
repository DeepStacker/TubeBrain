"""reconcile_users_schema_columns

Revision ID: c2f4f8a29f7b
Revises: bdcf0fc06a02
Create Date: 2026-04-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c2f4f8a29f7b"
down_revision: Union[str, None] = "bdcf0fc06a02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    columns = _column_names(inspector, "users")

    if "avatar_url" not in columns:
        op.add_column("users", sa.Column("avatar_url", sa.String(length=1024), nullable=True))

    if "auth_provider" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "auth_provider",
                sa.String(length=50),
                nullable=False,
                server_default=sa.text("'google'"),
            ),
        )

    if "auth_provider_id" not in columns:
        op.add_column("users", sa.Column("auth_provider_id", sa.String(length=255), nullable=True))

    if "hashed_password" not in columns:
        op.add_column("users", sa.Column("hashed_password", sa.String(length=255), nullable=True))

    if "is_active" not in columns:
        op.add_column(
            "users",
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        )

    if "is_admin" not in columns:
        op.add_column(
            "users",
            sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )

    if "created_at" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
        )

    if "updated_at" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
        )

    if "settings" not in columns:
        op.add_column("users", sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    columns = _column_names(inspector, "users")

    for column_name in [
        "settings",
        "updated_at",
        "created_at",
        "is_admin",
        "is_active",
        "hashed_password",
        "auth_provider_id",
        "auth_provider",
        "avatar_url",
    ]:
        if column_name in columns:
            op.drop_column("users", column_name)
