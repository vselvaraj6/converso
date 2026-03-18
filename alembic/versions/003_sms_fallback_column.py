"""Add sms_fallback_sent column to leads

Revision ID: 003_sms_fallback
Revises: 002_add_campaigns
Create Date: 2026-03-18

Changes:
- leads: add sms_fallback_sent boolean column (default false)
"""

from alembic import op
import sqlalchemy as sa

revision = "003_sms_fallback"
down_revision = "002_add_campaigns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column("sms_fallback_sent", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("leads", "sms_fallback_sent")
