"""add provision review history

Revision ID: af112fb7600e
Revises: 8d3803c6aaad
Create Date: 2026-08-27 15:55:06.306970

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af112fb7600e'
down_revision: Union[str, Sequence[str], None] = '8d3803c6aaad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create provision review history."""

    op.create_table(
        "regulatory_change_provision_reviews",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "provision_impact_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "review_status",
            sa.String(length=50),
            nullable=False,
        ),

        sa.Column(
            "review_notes",
            sa.Text(),
            nullable=False,
        ),

        sa.Column(
            "reviewed_by_user_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "reviewed_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            [
                "provision_impact_id",
            ],
            [
                "regulatory_change_provision_impacts.id",
            ],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            [
                "reviewed_by_user_id",
            ],
            [
                "users.id",
            ],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_id"
        ),
        "regulatory_change_provision_reviews",
        [
            "id",
        ],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_provision_impact_id"
        ),
        "regulatory_change_provision_reviews",
        [
            "provision_impact_id",
        ],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_review_status"
        ),
        "regulatory_change_provision_reviews",
        [
            "review_status",
        ],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_reviewed_by_user_id"
        ),
        "regulatory_change_provision_reviews",
        [
            "reviewed_by_user_id",
        ],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_reviewed_at"
        ),
        "regulatory_change_provision_reviews",
        [
            "reviewed_at",
        ],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_regulatory_change_provision_reviews_created_at"
        ),
        "regulatory_change_provision_reviews",
        [
            "created_at",
        ],
        unique=False,
    )


def downgrade() -> None:
    """Remove provision review history."""

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_created_at"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_reviewed_at"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_reviewed_by_user_id"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_review_status"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_provision_impact_id"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_index(
        op.f(
            "ix_regulatory_change_provision_reviews_id"
        ),
        table_name=(
            "regulatory_change_provision_reviews"
        ),
    )

    op.drop_table(
        "regulatory_change_provision_reviews"
    )