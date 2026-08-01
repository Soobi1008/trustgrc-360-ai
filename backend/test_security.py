from app.core.security import (
    hash_password,
    verify_password,
)

password = "TrustGRC123!"

hashed = hash_password(password)

print("HASH:", hashed)

print(
    "VALID:",
    verify_password(
        password,
        hashed,
    ),
)