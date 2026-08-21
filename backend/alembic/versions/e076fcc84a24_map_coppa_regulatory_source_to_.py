"""map COPPA regulatory source to canonical regulation

Revision ID: e076fcc84a24
Revises: 83fa60ad934e
Create Date: 2026-08-21
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e076fcc84a24"
down_revision = "83fa60ad934e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE regulatory_sources
            SET regulation_id = (
                SELECT id
                FROM regulations
                WHERE short_name = 'COPPA'
                LIMIT 1
            )
            WHERE regulation_code = 'COPPA'
              AND regulation_id IS NULL
              AND EXISTS (
                  SELECT 1
                  FROM regulations
                  WHERE short_name = 'COPPA'
              )
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE regulatory_sources
            SET regulation_id = NULL
            WHERE regulation_code = 'COPPA'
              AND regulation_id = (
                  SELECT id
                  FROM regulations
                  WHERE short_name = 'COPPA'
                  LIMIT 1
              )
            """
        )
    )