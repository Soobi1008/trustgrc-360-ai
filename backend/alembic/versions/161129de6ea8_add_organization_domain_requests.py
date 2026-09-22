"""add organization domain requests

Revision ID: 161129de6ea8
Revises: d658ca2dcbd0
Create Date: 2026-09-19 23:25:27.058430
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "161129de6ea8"
down_revision: Union[str, Sequence[str], None] = (
    "d658ca2dcbd0"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_domain_requests",
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
            "requester_email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "requester_name",
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

    with op.batch_alter_table(
        "organization_domain_requests",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_domain"
            ),
            ["domain"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_id"
            ),
            ["id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_organization_id"
            ),
            ["organization_id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_requester_email"
            ),
            ["requester_email"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_reviewed_by_user_id"
            ),
            ["reviewed_by_user_id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f(
                "ix_organization_domain_requests_status"
            ),
            ["status"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "organization_domain_requests",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_status"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_reviewed_by_user_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_requester_email"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_organization_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_id"
            )
        )
        batch_op.drop_index(
            batch_op.f(
                "ix_organization_domain_requests_domain"
            )
        )

    op.drop_table(
        "organization_domain_requests"
    )