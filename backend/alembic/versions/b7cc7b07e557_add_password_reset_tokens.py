"""add password reset tokens

Revision ID: b7cc7b07e557
Revises: dc55fc952504
Create Date: 2026-08-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7cc7b07e557"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = "dc55fc952504"

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
    op.create_table(
        "password_reset_tokens",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
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
            server_default=sa.text(
                "(CURRENT_TIMESTAMP)"
            ),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),
    )

    with op.batch_alter_table(
        "password_reset_tokens",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            batch_op.f(
                "ix_password_reset_tokens_id"
            ),
            ["id"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_password_reset_tokens_token_hash"
            ),
            ["token_hash"],
            unique=True,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_password_reset_tokens_user_id"
            ),
            ["user_id"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "password_reset_tokens",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f(
                "ix_password_reset_tokens_user_id"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_password_reset_tokens_token_hash"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_password_reset_tokens_id"
            )
        )

    op.drop_table(
        "password_reset_tokens"
    )