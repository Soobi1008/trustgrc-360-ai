"""add email verification

Revision ID: dc55fc952504
Revises:
Create Date: 2026-08-13 22:01:41.966219
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dc55fc952504"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = None

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
    """
    Add TrustGRC email-verification support.

    Changes:
    - Create email_verification_tokens table
    - Add users.email_verified
    - Add users.email_verified_at
    """

    op.create_table(
        "email_verification_tokens",

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
        "email_verification_tokens",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            batch_op.f(
                "ix_email_verification_tokens_id"
            ),
            ["id"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_email_verification_tokens_token_hash"
            ),
            ["token_hash"],
            unique=True,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_email_verification_tokens_user_id"
            ),
            ["user_id"],
            unique=False,
        )

    # Existing users need a safe value while SQLite
    # rebuilds the table. We initially default them to
    # verified so current development accounts remain usable.
    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "email_verified",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            )
        )

        batch_op.add_column(
            sa.Column(
                "email_verified_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )

    # Remove the database-level default after migration.
    # New registrations will explicitly receive False
    # from the SQLAlchemy application model.
    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.alter_column(
            "email_verified",
            server_default=None,
        )


def downgrade() -> None:
    """
    Remove TrustGRC email-verification support.
    """

    with op.batch_alter_table(
        "users",
        schema=None,
    ) as batch_op:
        batch_op.drop_column(
            "email_verified_at"
        )

        batch_op.drop_column(
            "email_verified"
        )

    with op.batch_alter_table(
        "email_verification_tokens",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f(
                "ix_email_verification_tokens_user_id"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_email_verification_tokens_token_hash"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_email_verification_tokens_id"
            )
        )

    op.drop_table(
        "email_verification_tokens"
    )