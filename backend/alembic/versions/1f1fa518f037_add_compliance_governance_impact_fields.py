"""add compliance governance impact fields

Revision ID: 1f1fa518f037
Revises: 262843fd1b42
Create Date: 2026-08-28 23:03:41.203627

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1f1fa518f037"
down_revision: Union[str, Sequence[str], None] = (
    "262843fd1b42"
)
branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None
depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    """Upgrade schema."""

    with op.batch_alter_table(
        "regulatory_change_provision_impacts",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "compliance_governance_impact",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "evidence_documentation",
                sa.Text(),
                nullable=True,
            )
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table(
        "regulatory_change_provision_impacts",
        schema=None,
    ) as batch_op:
        batch_op.drop_column(
            "evidence_documentation"
        )

        batch_op.drop_column(
            "compliance_governance_impact"
        )