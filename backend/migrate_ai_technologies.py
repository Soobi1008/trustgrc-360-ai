import json
import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent / "trustgrc.db"

def main() -> None:
    if not DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"Database not found: {DATABASE_PATH}"
        )

    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()

    try:
        cursor.execute("PRAGMA table_info(ai_systems)")
        columns = {
            row[1]
            for row in cursor.fetchall()
        }

        if "ai_technologies" not in columns:
            cursor.execute(
                """
                ALTER TABLE ai_systems
                ADD COLUMN ai_technologies JSON
                """
            )

            print(
                "Added ai_technologies column."
            )
        else:
            print(
                "ai_technologies column already exists."
            )

        if "model_type" in columns:
            cursor.execute(
                """
                SELECT id, model_type
                FROM ai_systems
                """
            )

            records = cursor.fetchall()

            for ai_system_id, model_type in records:
                technologies = (
                    [model_type]
                    if model_type
                    else []
                )

                cursor.execute(
                    """
                    UPDATE ai_systems
                    SET ai_technologies = ?
                    WHERE id = ?
                    """,
                    (
                        json.dumps(technologies),
                        ai_system_id,
                    ),
                )

            print(
                f"Migrated {len(records)} existing records."
            )

        cursor.execute(
            """
            UPDATE ai_systems
            SET ai_technologies = '[]'
            WHERE ai_technologies IS NULL
            """
        )

        connection.commit()

        print(
            "AI technologies migration completed successfully."
        )

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    main()