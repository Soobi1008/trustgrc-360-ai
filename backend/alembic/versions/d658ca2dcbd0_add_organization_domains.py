"""add organization domains

Revision ID: d658ca2dcbd0
Revises: 3f0b5a6333e4
Create Date: 2026-09-19 23:13:12.921207
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d658ca2dcbd0"
down_revision: Union[str, Sequence[str], None] = (
    "3f0b5a6333e4"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_domains",
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
            "domain",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "verified_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "verified_at",
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
            ["verified_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "domain",
            name="uq_organization_domains_domain",
        ),
    )

    with op.batch_alter_table(
        "organization_domains",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domains_domain"
            ),
            ["domain"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domains_id"
            ),
            ["id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domains_organization_id"
            ),
            ["organization_id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domains_status"
            ),
            ["status"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domains_verified_by_user_id"
            ),
            ["verified_by_user_id"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "organization_domains",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domains_verified_by_user_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domains_status"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domains_organization_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domains_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domains_domain"
            )
        )

    op.drop_table(
        "organization_domains"
    )