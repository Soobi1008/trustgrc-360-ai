"""add regulatory provenance evidence

Revision ID: 3e586d3e8a1c
Revises: 61f28187a6c4
Create Date: 2026-08-17 21:05:20.879860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3e586d3e8a1c"
down_revision: Union[str, Sequence[str], None] = "61f28187a6c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =====================================================
    # REGULATORY SNAPSHOT PROVENANCE
    # =====================================================

    with op.batch_alter_table(
        "regulatory_snapshots",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "source_url",
                sa.Text(),
                nullable=True,
            )
        )

        # Historical snapshots existed before provenance
        # tracking was introduced, so we must not claim
        # that their retrieval status was definitively "ok".
        batch_op.add_column(
            sa.Column(
                "retrieval_status",
                sa.String(length=50),
                nullable=False,
                server_default="legacy_unknown",
            )
        )

        batch_op.add_column(
            sa.Column(
                "content_type",
                sa.String(length=255),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "authoritative_identifier",
                sa.String(length=100),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "authoritative_version",
                sa.String(length=100),
                nullable=True,
            )
        )

        # Keep this nullable during migration.
        # Existing records will be backfilled using their
        # original captured_at timestamp instead of the
        # migration execution timestamp.
        batch_op.add_column(
            sa.Column(
                "retrieved_at",
                sa.DateTime(),
                nullable=True,
            )
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_snapshots_retrieval_status"
            ),
            ["retrieval_status"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_snapshots_authoritative_identifier"
            ),
            ["authoritative_identifier"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_snapshots_retrieved_at"
            ),
            ["retrieved_at"],
            unique=False,
        )

    # Backfill the best available historical retrieval time.
    # captured_at is the truthful timestamp already stored
    # for legacy snapshots.
    op.execute(
        """
        UPDATE regulatory_snapshots
        SET retrieved_at = captured_at
        WHERE retrieved_at IS NULL
        """
    )

    # =====================================================
    # REGULATORY CHANGE EVIDENCE LINKS
    # =====================================================

    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "previous_snapshot_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "new_snapshot_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "technical_severity",
                sa.String(length=50),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "difference_ratio",
                sa.Float(),
                nullable=True,
            )
        )

        # Existing change records do not have the new
        # explicit snapshot relationships yet, so their
        # evidence state is marked as partial rather than
        # falsely claiming full provenance.
        batch_op.add_column(
            sa.Column(
                "evidence_status",
                sa.String(length=50),
                nullable=False,
                server_default="legacy_partial",
            )
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_previous_snapshot_id"
            ),
            ["previous_snapshot_id"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_new_snapshot_id"
            ),
            ["new_snapshot_id"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_technical_severity"
            ),
            ["technical_severity"],
            unique=False,
        )

        batch_op.create_index(
            batch_op.f(
                "ix_regulatory_changes_evidence_status"
            ),
            ["evidence_status"],
            unique=False,
        )

        batch_op.create_foreign_key(
            "fk_regulatory_changes_previous_snapshot_id",
            "regulatory_snapshots",
            ["previous_snapshot_id"],
            ["id"],
            ondelete="SET NULL",
        )

        batch_op.create_foreign_key(
            "fk_regulatory_changes_new_snapshot_id",
            "regulatory_snapshots",
            ["new_snapshot_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    # =====================================================
    # REMOVE REGULATORY CHANGE EVIDENCE LINKS
    # =====================================================

    with op.batch_alter_table(
        "regulatory_changes",
        schema=None,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_regulatory_changes_new_snapshot_id",
            type_="foreignkey",
        )

        batch_op.drop_constraint(
            "fk_regulatory_changes_previous_snapshot_id",
            type_="foreignkey",
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_evidence_status"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_technical_severity"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_new_snapshot_id"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_changes_previous_snapshot_id"
            )
        )

        batch_op.drop_column(
            "evidence_status"
        )

        batch_op.drop_column(
            "difference_ratio"
        )

        batch_op.drop_column(
            "technical_severity"
        )

        batch_op.drop_column(
            "new_snapshot_id"
        )

        batch_op.drop_column(
            "previous_snapshot_id"
        )

    # =====================================================
    # REMOVE REGULATORY SNAPSHOT PROVENANCE
    # =====================================================

    with op.batch_alter_table(
        "regulatory_snapshots",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_snapshots_retrieved_at"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_snapshots_authoritative_identifier"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_regulatory_snapshots_retrieval_status"
            )
        )

        batch_op.drop_column(
            "retrieved_at"
        )

        batch_op.drop_column(
            "authoritative_version"
        )

        batch_op.drop_column(
            "authoritative_identifier"
        )

        batch_op.drop_column(
            "content_type"
        )

        batch_op.drop_column(
            "retrieval_status"
        )

        batch_op.drop_column(
            "source_url"
        )