"""Cal.com scheduling + lead agent assignment

Revision ID: 001_calcom_agent
Revises:
Create Date: 2026-03-11

Changes:
- companies: add cal_booking_url, cal_event_type_id; drop calendar_email
- leads: add assigned_agent_id FK to users
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_calcom_agent"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── companies ─────────────────────────────────────────────────────────────
    op.add_column("companies", sa.Column("cal_booking_url", sa.String(), nullable=True))
    op.add_column("companies", sa.Column("cal_event_type_id", sa.Integer(), nullable=True))
    op.drop_column("companies", "calendar_email")

    # ── leads ─────────────────────────────────────────────────────────────────
    op.add_column(
        "leads",
        sa.Column(
            "assigned_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_leads_assigned_agent_id", "leads", ["assigned_agent_id"])


def downgrade() -> None:
    op.drop_index("ix_leads_assigned_agent_id", table_name="leads")
    op.drop_column("leads", "assigned_agent_id")

    op.add_column("companies", sa.Column("calendar_email", sa.String(), nullable=True))
    op.drop_column("companies", "cal_event_type_id")
    op.drop_column("companies", "cal_booking_url")
