"""Add campaigns table

Revision ID: 002_add_campaigns
Revises: b00c8a1c7558
Create Date: 2026-03-18

Changes:
- campaigns: new table for user-created outreach campaigns
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_add_campaigns"
down_revision = "b00c8a1c7558"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_campaigns_company_id", "campaigns", ["company_id"])
    op.create_index("ix_campaigns_status", "campaigns", ["status"])


def downgrade() -> None:
    op.drop_index("ix_campaigns_status", table_name="campaigns")
    op.drop_index("ix_campaigns_company_id", table_name="campaigns")
    op.drop_table("campaigns")
