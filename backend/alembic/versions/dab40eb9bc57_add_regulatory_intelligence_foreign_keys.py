"""add regulatory intelligence foreign keys

Revision ID: dab40eb9bc57
Revises: b7cc7b07e557
Create Date: 2026-08-16 23:09:14.086039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dab40eb9bc57'
down_revision: Union[str, Sequence[str], None] = 'b7cc7b07e557'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.create_foreign_key(
            "fk_regulatory_changes_source_id",
            "regulatory_sources",
            ["source_id"],
            ["id"],
            ondelete="CASCADE",
        )

    with op.batch_alter_table(
        "regulatory_snapshots",
        schema=None,
    ) as batch_op:
        batch_op.create_foreign_key(
            "fk_regulatory_snapshots_source_id",
            "regulatory_sources",
            ["source_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "regulatory_snapshots",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_regulatory_snapshots_source_id",
            type_="foreignkey",
        )

    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_regulatory_changes_source_id",
            type_="foreignkey",
        )