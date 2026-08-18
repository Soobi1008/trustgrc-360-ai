"""add regulatory intelligence phase 2 analysis

Revision ID: 83fa60ad934e
Revises: 3e586d3e8a1c
Create Date: 2026-08-18 21:31:49.131627

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# =========================================================
# ALEMBIC REVISION IDENTIFIERS
# =========================================================

revision: str = "83fa60ad934e"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "3e586d3e8a1c"

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


# =========================================================
# HELPERS
# =========================================================

def table_exists(
    inspector: sa.Inspector,
    table_name: str,
) -> bool:
    return (
        table_name
        in inspector.get_table_names()
    )


def column_exists(
    inspector: sa.Inspector,
    table_name: str,
    column_name: str,
) -> bool:
    return column_name in {
        column["name"]
        for column
        in inspector.get_columns(
            table_name
        )
    }


# =========================================================
# UPGRADE
# =========================================================

def upgrade() -> None:
    """
    Regulatory Intelligence Phase 2.

    This migration:

    1. Links RegulatorySource to the canonical
       Regulation knowledge base.

    2. Creates versioned structured regulatory
       change analyses.

    3. Creates Article / provision-level impact
       records.

    4. Maps the verified EU AI Act regulatory
       source to the existing canonical EU AI Act
       Regulation record.

    The migration tolerates the temporary local
    schema drift caused by the historical use of
    Base.metadata.create_all().

    Existing Phase 2 tables are preserved when
    already present.
    """

    bind = op.get_bind()

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # REGULATORY SOURCE -> CANONICAL REGULATION
    # =====================================================

    if not column_exists(
        inspector,
        "regulatory_sources",
        "regulation_id",
    ):
        with op.batch_alter_table(
            "regulatory_sources",
            schema=None,
        ) as batch_op:
            batch_op.add_column(
                sa.Column(
                    "regulation_id",
                    sa.Integer(),
                    nullable=True,
                )
            )

            batch_op.create_index(
                (
                    "ix_regulatory_sources_"
                    "regulation_id"
                ),
                [
                    "regulation_id",
                ],
                unique=False,
            )

            batch_op.create_foreign_key(
                (
                    "fk_regulatory_sources_"
                    "regulation_id"
                ),
                "regulations",
                [
                    "regulation_id",
                ],
                [
                    "id",
                ],
                ondelete="SET NULL",
            )


    # Refresh inspector after schema alteration.

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # REGULATORY CHANGE ANALYSIS
    # =====================================================

    if not table_exists(
        inspector,
        "regulatory_change_analyses",
    ):
        op.create_table(
            "regulatory_change_analyses",

            sa.Column(
                "id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "regulatory_change_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "analysis_version",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),

            sa.Column(
                "analysis_status",
                sa.String(
                    length=50
                ),
                nullable=False,
                server_default="draft",
            ),

            sa.Column(
                "analysis_origin",
                sa.String(
                    length=50
                ),
                nullable=False,
                server_default="human",
            ),

            sa.Column(
                "analysis_method",
                sa.String(
                    length=255
                ),
                nullable=True,
            ),

            sa.Column(
                "overall_impact_level",
                sa.String(
                    length=50
                ),
                nullable=True,
            ),

            sa.Column(
                "executive_summary",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "generated_by_model",
                sa.String(
                    length=255
                ),
                nullable=True,
            ),

            sa.Column(
                "generated_at",
                sa.DateTime(),
                nullable=True,
            ),

            sa.Column(
                "validated_by_user_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "validated_at",
                sa.DateTime(),
                nullable=True,
            ),

            sa.Column(
                "validation_notes",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "supersedes_analysis_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text(
                    "CURRENT_TIMESTAMP"
                ),
            ),

            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text(
                    "CURRENT_TIMESTAMP"
                ),
            ),

            sa.ForeignKeyConstraint(
                [
                    "regulatory_change_id",
                ],
                [
                    "regulatory_changes.id",
                ],
                name=(
                    "fk_regulatory_change_analyses_"
                    "regulatory_change_id"
                ),
                ondelete="CASCADE",
            ),

            sa.ForeignKeyConstraint(
                [
                    "validated_by_user_id",
                ],
                [
                    "users.id",
                ],
                name=(
                    "fk_regulatory_change_analyses_"
                    "validated_by_user_id"
                ),
                ondelete="SET NULL",
            ),

            sa.ForeignKeyConstraint(
                [
                    "supersedes_analysis_id",
                ],
                [
                    "regulatory_change_analyses.id",
                ],
                name=(
                    "fk_regulatory_change_analyses_"
                    "supersedes_analysis_id"
                ),
                ondelete="SET NULL",
            ),

            sa.PrimaryKeyConstraint(
                "id"
            ),

            sa.UniqueConstraint(
                "regulatory_change_id",
                "analysis_version",
                name=(
                    "uq_regulatory_change_"
                    "analysis_version"
                ),
            ),
        )


        # -------------------------------------------------
        # ANALYSIS INDEXES
        # -------------------------------------------------

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_id"
            ),
            "regulatory_change_analyses",
            [
                "id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_regulatory_change_id"
            ),
            "regulatory_change_analyses",
            [
                "regulatory_change_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_analysis_status"
            ),
            "regulatory_change_analyses",
            [
                "analysis_status",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_analysis_origin"
            ),
            "regulatory_change_analyses",
            [
                "analysis_origin",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_overall_impact_level"
            ),
            "regulatory_change_analyses",
            [
                "overall_impact_level",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_validated_by_user_id"
            ),
            "regulatory_change_analyses",
            [
                "validated_by_user_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_supersedes_analysis_id"
            ),
            "regulatory_change_analyses",
            [
                "supersedes_analysis_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "analyses_created_at"
            ),
            "regulatory_change_analyses",
            [
                "created_at",
            ],
            unique=False,
        )


    # Refresh after potential table creation.

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # REGULATORY CHANGE PROVISION IMPACT
    # =====================================================

    if not table_exists(
        inspector,
        (
            "regulatory_change_"
            "provision_impacts"
        ),
    ):
        op.create_table(
            (
                "regulatory_change_"
                "provision_impacts"
            ),

            sa.Column(
                "id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "analysis_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "regulation_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "regulation_article_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "regulation_obligation_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "provision_reference",
                sa.String(
                    length=255
                ),
                nullable=False,
            ),

            sa.Column(
                "provision_title",
                sa.String(
                    length=500
                ),
                nullable=True,
            ),

            sa.Column(
                "change_type",
                sa.String(
                    length=100
                ),
                nullable=False,
                server_default="unclassified",
            ),

            sa.Column(
                "previous_requirement",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "current_requirement",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "change_explanation",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "legal_interpretation",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "operational_impact",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "recommended_action",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "impact_level",
                sa.String(
                    length=50
                ),
                nullable=True,
            ),

            sa.Column(
                "source_snapshot_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "source_url",
                sa.Text(),
                nullable=True,
            ),

            sa.Column(
                "review_status",
                sa.String(
                    length=50
                ),
                nullable=False,
                server_default="pending_review",
            ),

            sa.Column(
                "reviewed_by_user_id",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "reviewed_at",
                sa.DateTime(),
                nullable=True,
            ),

            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text(
                    "CURRENT_TIMESTAMP"
                ),
            ),

            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text(
                    "CURRENT_TIMESTAMP"
                ),
            ),

            sa.ForeignKeyConstraint(
                [
                    "analysis_id",
                ],
                [
                    (
                        "regulatory_change_"
                        "analyses.id"
                    ),
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_analysis_id"
                ),
                ondelete="CASCADE",
            ),

            sa.ForeignKeyConstraint(
                [
                    "regulation_id",
                ],
                [
                    "regulations.id",
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_regulation_id"
                ),
                ondelete="SET NULL",
            ),

            sa.ForeignKeyConstraint(
                [
                    "regulation_article_id",
                ],
                [
                    "regulation_articles.id",
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_"
                    "regulation_article_id"
                ),
                ondelete="SET NULL",
            ),

            sa.ForeignKeyConstraint(
                [
                    "regulation_obligation_id",
                ],
                [
                    "regulation_obligations.id",
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_"
                    "regulation_obligation_id"
                ),
                ondelete="SET NULL",
            ),

            sa.ForeignKeyConstraint(
                [
                    "source_snapshot_id",
                ],
                [
                    "regulatory_snapshots.id",
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_"
                    "source_snapshot_id"
                ),
                ondelete="SET NULL",
            ),

            sa.ForeignKeyConstraint(
                [
                    "reviewed_by_user_id",
                ],
                [
                    "users.id",
                ],
                name=(
                    "fk_regulatory_change_"
                    "provision_impacts_"
                    "reviewed_by_user_id"
                ),
                ondelete="SET NULL",
            ),

            sa.PrimaryKeyConstraint(
                "id"
            ),
        )


        # -------------------------------------------------
        # PROVISION IMPACT INDEXES
        # -------------------------------------------------

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_analysis_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "analysis_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_regulation_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "regulation_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_"
                "regulation_article_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "regulation_article_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_"
                "regulation_obligation_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "regulation_obligation_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_"
                "provision_reference"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "provision_reference",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_change_type"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "change_type",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_impact_level"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "impact_level",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_"
                "source_snapshot_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "source_snapshot_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_review_status"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "review_status",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_"
                "reviewed_by_user_id"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "reviewed_by_user_id",
            ],
            unique=False,
        )

        op.create_index(
            (
                "ix_regulatory_change_"
                "provision_impacts_created_at"
            ),
            (
                "regulatory_change_"
                "provision_impacts"
            ),
            [
                "created_at",
            ],
            unique=False,
        )


    # =====================================================
    # EU AI ACT VERIFIED CANONICAL MAPPING
    # =====================================================
    #
    # Verified:
    #
    # RegulatorySource:
    #   regulation_code = EU_AI_ACT
    #
    # Canonical Regulation:
    #   short_name = EU AI Act
    #
    # Both use the authoritative EUR-Lex
    # Regulation (EU) 2024/1689 source.
    #
    # HIPAA Security Rule, COPPA and PIPEDA are
    # deliberately left unmapped until canonical
    # Regulation records are reconciled.
    # =====================================================

    op.execute(
        sa.text(
            """
            UPDATE regulatory_sources
            SET regulation_id = (
                SELECT id
                FROM regulations
                WHERE short_name = 'EU AI Act'
                LIMIT 1
            )
            WHERE regulation_code = 'EU_AI_ACT'
              AND regulation_id IS NULL
            """
        )
    )


# =========================================================
# DOWNGRADE
# =========================================================

def downgrade() -> None:
    """
    Remove Regulatory Intelligence Phase 2.

    The downgrade is also defensive so it can
    tolerate development databases that may have
    experienced historical schema drift.
    """

    bind = op.get_bind()

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # DROP PROVISION IMPACT TABLE
    # =====================================================

    if table_exists(
        inspector,
        (
            "regulatory_change_"
            "provision_impacts"
        ),
    ):
        op.drop_table(
            (
                "regulatory_change_"
                "provision_impacts"
            )
        )


    # Refresh inspector.

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # DROP ANALYSIS TABLE
    # =====================================================

    if table_exists(
        inspector,
        "regulatory_change_analyses",
    ):
        op.drop_table(
            "regulatory_change_analyses"
        )


    # Refresh inspector.

    inspector = sa.inspect(
        bind
    )


    # =====================================================
    # REMOVE CANONICAL REGULATION LINK
    # =====================================================

    if column_exists(
        inspector,
        "regulatory_sources",
        "regulation_id",
    ):
        with op.batch_alter_table(
            "regulatory_sources",
            schema=None,
        ) as batch_op:
            batch_op.drop_constraint(
                (
                    "fk_regulatory_sources_"
                    "regulation_id"
                ),
                type_="foreignkey",
            )

            batch_op.drop_index(
                (
                    "ix_regulatory_sources_"
                    "regulation_id"
                )
            )

            batch_op.drop_column(
                "regulation_id"
            )