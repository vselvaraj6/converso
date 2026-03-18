"""Add needs_human_review flag to leads

Revision ID: 005_human_handoff
Revises: 004_call_config
Create Date: 2026-03-18

Changes:
- leads: add needs_human_review boolean column (default false)
  Auto-set when AI detects negative sentiment + question intent (frustrated lead)
  or when agent manually escalates via PATCH /api/leads/{id}
"""

from alembic import op
import sqlalchemy as sa

revision = "005_human_handoff"
down_revision = "004_call_config"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column("needs_human_review", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_leads_needs_human_review", "leads", ["needs_human_review"])


def downgrade() -> None:
    op.drop_index("ix_leads_needs_human_review", table_name="leads")
    op.drop_column("leads", "needs_human_review")
