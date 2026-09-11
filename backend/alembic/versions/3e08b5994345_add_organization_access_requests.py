"""add organization access requests

Revision ID: 3e08b5994345
Revises: 1f1fa518f037
Create Date: 2026-09-09 22:04:46.448099

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3e08b5994345"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = "1f1fa518f037"
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

    op.create_table(
        "organization_access_requests",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "full_name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "review_notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "reviewed_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "(CURRENT_TIMESTAMP)"
            ),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f(
            "ix_organization_access_requests_email"
        ),
        "organization_access_requests",
        ["email"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_organization_access_requests_id"
        ),
        "organization_access_requests",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_organization_access_requests_organization_id"
        ),
        "organization_access_requests",
        ["organization_id"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_organization_access_requests_reviewed_by_user_id"
        ),
        "organization_access_requests",
        ["reviewed_by_user_id"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_organization_access_requests_status"
        ),
        "organization_access_requests",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f(
            "ix_organization_access_requests_status"
        ),
        table_name=
            "organization_access_requests",
    )

    op.drop_index(
        op.f(
            "ix_organization_access_requests_reviewed_by_user_id"
        ),
        table_name=
            "organization_access_requests",
    )

    op.drop_index(
        op.f(
            "ix_organization_access_requests_organization_id"
        ),
        table_name=
            "organization_access_requests",
    )

    op.drop_index(
        op.f(
            "ix_organization_access_requests_id"
        ),
        table_name=
            "organization_access_requests",
    )

    op.drop_index(
        op.f(
            "ix_organization_access_requests_email"
        ),
        table_name=
            "organization_access_requests",
    )

    op.drop_table(
        "organization_access_requests"
    )