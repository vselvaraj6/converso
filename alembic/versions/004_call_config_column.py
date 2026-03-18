"""Add call_config column to companies

Revision ID: 004_call_config
Revises: 003_sms_fallback
Create Date: 2026-03-18

Changes:
- companies: add call_config JSON column for per-company call retry settings
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_call_config"
down_revision = "003_sms_fallback"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("call_config", postgresql.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("companies", "call_config")
