"""add regulatory change publisher audit

Revision ID: 262843fd1b42
Revises: af112fb7600e
Create Date: 2026-08-28 00:06:18.817554

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "262843fd1b42"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = "af112fb7600e"
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
    """Add publisher audit attribution."""

    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "published_by_user_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_"
                "published_by_user_id"
            ),
            [
                "published_by_user_id"
            ],
            unique=False,
        )

        batch_op.create_foreign_key(
            "fk_regulatory_changes_published_by_user_id_users",
            "users",
            [
                "published_by_user_id"
            ],
            [
                "id"
            ],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    """Remove publisher audit attribution."""

    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_regulatory_changes_published_by_user_id_users",
            type_="foreignkey",
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_"
                "published_by_user_id"
            )
        )

        batch_op.drop_column(
            "published_by_user_id"
        )