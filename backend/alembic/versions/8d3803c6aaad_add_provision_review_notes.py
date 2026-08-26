"""add provision review notes

Revision ID: 8d3803c6aaad
Revises: e076fcc84a24
Create Date: 2026-08-23 15:32:33.419311

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8d3803c6aaad"
down_revision: Union[str, Sequence[str], None] = "e076fcc84a24"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "regulatory_change_provision_impacts",
        sa.Column(
            "review_notes",
            sa.Text(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "regulatory_change_provision_impacts",
        "review_notes",
    )