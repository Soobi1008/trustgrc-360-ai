from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from app.core.config import settings
from app.db.base import Base

from app.models import password_reset_token

# ---------------------------------------------------------
# TRUSTGRC MODEL REGISTRATION
# ---------------------------------------------------------
#
# These imports ensure every SQLAlchemy model is registered
# in Base.metadata before Alembic compares the Python schema
# with the existing database.
#
# We import modules rather than individual model classes.
# ---------------------------------------------------------

from app.models import ai_risk
from app.models import ai_system
from app.models import assessment
from app.models import assessment_finding
from app.models import continent
from app.models import country
from app.models import data_category
from app.models import email_verification_token
from app.models import generated_risk
from app.models import human_verification_challenge
from app.models import industry
from app.models import jurisdiction
from app.models import obligation_control
from app.models import organization
from app.models import organization_data_category
from app.models import organization_jurisdiction
from app.models import regulation
from app.models import regulation_article
from app.models import regulation_data_category
from app.models import regulation_industry
from app.models import regulation_jurisdiction
from app.models import regulation_obligation
from app.models import user

# Regulatory Intelligence models live in a separate package.
from app.regulatory_intelligence import models as regulatory_intelligence_models


# Alembic configuration object.
config = context.config


# Use TrustGRC's actual database URL from .env.
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL,
)


# Configure logging from alembic.ini.
if config.config_file_name is not None:
    fileConfig(
        config.config_file_name
    )


# Tell Alembic which SQLAlchemy metadata
# represents the desired TrustGRC schema.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations without opening a live
    database connection.
    """

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations using a live database
    connection.
    """

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {},
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=
                target_metadata,
            compare_type=True,

            # Helpful for SQLite schema migrations.
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()