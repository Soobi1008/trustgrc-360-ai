import re


COMMON_PASSWORD_WORDS = {
    "password",
    "welcome",
    "admin",
    "administrator",
    "company",
    "trustgrc",
    "qwerty",
    "letmein",
    "login",
    "changeme",
    "secret",
    "default",
}


def validate_password_strength(
    password: str,
    *,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    organisation_name: str | None = None,
) -> list[str]:
    """
    Validate a password against the TrustGRC AI 360
    registration password policy.

    Returns a list of validation errors.
    An empty list means the password is acceptable.
    """

    errors: list[str] = []

    if len(password) < 12:
        errors.append(
            "Password must contain at least 12 characters."
        )

    if len(password) > 128:
        errors.append(
            "Password must not exceed 128 characters."
        )

    if not re.search(r"[A-Z]", password):
        errors.append(
            "Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        errors.append(
            "Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        errors.append(
            "Password must contain at least one number."
        )

    if not re.search(
        r"""[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]""",
        password,
    ):
        errors.append(
            "Password must contain at least one special character."
        )

    normalized_password = password.lower()

    for common_word in COMMON_PASSWORD_WORDS:
        if common_word in normalized_password:
            errors.append(
                "Password contains a commonly used or prohibited word."
            )
            break

    personal_values = [
        first_name,
        last_name,
        organisation_name,
    ]

    if email:
        email_username = (
            email.strip()
            .lower()
            .split("@", 1)[0]
        )

        if len(email_username) >= 3:
            personal_values.append(email_username)

    for value in personal_values:
        if not value:
            continue

        normalized_value = re.sub(
            r"[^a-z0-9]",
            "",
            value.lower(),
        )

        if len(normalized_value) < 3:
            continue

        normalized_for_comparison = re.sub(
            r"[^a-z0-9]",
            "",
            normalized_password,
        )

        if normalized_value in normalized_for_comparison:
            errors.append(
                "Password must not contain your name, "
                "email identifier, or organisation name."
            )
            break

    return errors