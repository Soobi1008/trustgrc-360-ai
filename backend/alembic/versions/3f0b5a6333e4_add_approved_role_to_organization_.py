"""add approved role to organization access requests

Revision ID: 3f0b5a6333e4
Revises: 8a64a37dc1f5
Create Date: 2026-09-11
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f0b5a6333e4"
down_revision: Union[str, Sequence[str], None] = (
    "8a64a37dc1f5"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organization_access_requests",
        sa.Column(
            "approved_role",
            sa.String(length=50),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "organization_access_requests",
        "approved_role",
    )