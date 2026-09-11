"""add organization access invitation tokens

Revision ID: 8a64a37dc1f5
Revises: 3e08b5994345
Create Date: 2026-09-09 23:58:42.331612

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8a64a37dc1f5"
down_revision: Union[str, Sequence[str], None] = "3e08b5994345"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "organization_access_invitation_tokens",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "access_request_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "token_hash",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["access_request_id"],
            ["organization_access_requests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
        ),
    )

    op.create_index(
        "ix_organization_access_invitation_tokens_access_request_id",
        "organization_access_invitation_tokens",
        ["access_request_id"],
        unique=False,
    )

    op.create_index(
        "ix_organization_access_invitation_tokens_id",
        "organization_access_invitation_tokens",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_organization_access_invitation_tokens_token_hash",
        "organization_access_invitation_tokens",
        ["token_hash"],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_organization_access_invitation_tokens_token_hash",
        table_name="organization_access_invitation_tokens",
    )

    op.drop_index(
        "ix_organization_access_invitation_tokens_id",
        table_name="organization_access_invitation_tokens",
    )

    op.drop_index(
        "ix_organization_access_invitation_tokens_access_request_id",
        table_name="organization_access_invitation_tokens",
    )

    op.drop_table(
        "organization_access_invitation_tokens"
    )