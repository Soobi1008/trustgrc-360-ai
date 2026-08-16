"""add regulatory change review workflow

Revision ID: 61f28187a6c4
Revises: dab40eb9bc57
Create Date: 2026-08-16 23:47:22.825493

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61f28187a6c4'
down_revision: Union[str, Sequence[str], None] = 'dab40eb9bc57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "review_decision",
                sa.String(length=50),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "review_notes",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "reviewed_by_user_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "impact_level",
                sa.String(length=50),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "impact_summary",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "published_at",
                sa.DateTime(),
                nullable=True,
            )
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_review_status"
            ),
            ["review_status"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_review_decision"
            ),
            ["review_decision"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_reviewed_by_user_id"
            ),
            ["reviewed_by_user_id"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_impact_status"
            ),
            ["impact_status"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_impact_level"
            ),
            ["impact_level"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_detected_at"
            ),
            ["detected_at"],
            unique=False,
        )

        batch_op.create_foreign_key(
            "fk_regulatory_changes_reviewed_by_user_id",
            "users",
            ["reviewed_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_regulatory_changes_reviewed_by_user_id",
            type_="foreignkey",
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_detected_at"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_impact_level"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_impact_status"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_reviewed_by_user_id"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_review_decision"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_review_status"
            )
        )

        batch_op.drop_column(
            "published_at"
        )

        batch_op.drop_column(
            "impact_summary"
        )

        batch_op.drop_column(
            "impact_level"
        )

        batch_op.drop_column(
            "reviewed_by_user_id"
        )

        batch_op.drop_column(
            "review_notes"
        )

        batch_op.drop_column(
            "review_decision"
        )
