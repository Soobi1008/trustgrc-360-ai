from datetime import (
    datetime,
    timedelta,
    timezone,
)
import hashlib
import hmac
import random
import secrets
import string

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.password_policy import (
    validate_password_strength,
)
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.dependencies.auth import (
    get_current_user,
)
from app.models.human_verification_challenge import (
    HumanVerificationChallenge,
)
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    HumanChallengeResponse,
    RegistrationRequest,
    RegistrationResponse,
    TokenResponse,
)
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


CHALLENGE_EXPIRY_MINUTES = 5


BLOCKED_PERSONAL_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "hotmail.com",
    "hotmail.co.uk",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "gmx.com",
    "gmx.de",
    "mail.com",
    "yandex.com",
}


DISPOSABLE_DOMAINS = {
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.com",
    "temp-mail.org",
    "yopmail.com",
    "throwawaymail.com",
}


SHAPE_SYMBOLS = [
    "○",
    "△",
    "□",
    "◇",
    "★",
    "●",
    "▲",
    "■",
]


ODD_ONE_OUT_GROUPS = [
    (
        [
            "GDPR",
            "EU AI Act",
            "ISO 42001",
        ],
        [
            "Banana",
            "Bicycle",
            "Coffee",
            "Guitar",
        ],
    ),
    (
        [
            "Encryption",
            "Access Control",
            "MFA",
        ],
        [
            "Pineapple",
            "Tennis",
            "Violin",
            "Mountain",
        ],
    ),
    (
        [
            "Healthcare",
            "Finance",
            "Education",
        ],
        [
            "Triangle",
            "Orange",
            "Guitar",
            "Ocean",
        ],
    ),
    (
        [
            "Risk",
            "Control",
            "Evidence",
        ],
        [
            "Piano",
            "Apple",
            "River",
            "Bicycle",
        ],
    ),
]


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def ensure_aware_utc(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        timezone.utc
    )


def normalize_email(
    email: str,
) -> str:
    return email.strip().lower()


def extract_email_domain(
    email: str,
) -> str:
    normalized_email = normalize_email(
        email
    )

    if "@" not in normalized_email:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "A valid work email address "
                "is required."
            ),
        )

    domain = normalized_email.rsplit(
        "@",
        1,
    )[1].strip()

    if not domain:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "A valid work email address "
                "is required."
            ),
        )

    return domain


def validate_business_email(
    email: str,
) -> str:
    domain = extract_email_domain(
        email
    )

    if domain in BLOCKED_PERSONAL_DOMAINS:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Please use your organisation "
                "or company email address. "
                "Personal email domains are "
                "not accepted."
            ),
        )

    if domain in DISPOSABLE_DOMAINS:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Temporary or disposable email "
                "addresses are not accepted."
            ),
        )

    return domain


def normalize_human_answer(
    answer: str,
) -> str:
    return (
        answer
        .strip()
        .casefold()
    )


def hash_challenge_answer(
    challenge_id: str,
    answer: str,
) -> str:
    normalized_answer = (
        normalize_human_answer(
            answer
        )
    )

    message = (
        f"{challenge_id}:"
        f"{normalized_answer}"
    ).encode("utf-8")

    key = settings.JWT_SECRET_KEY.encode(
        "utf-8"
    )

    return hmac.new(
        key,
        message,
        hashlib.sha256,
    ).hexdigest()


def generate_arithmetic_challenge(
) -> tuple[
    str,
    str,
    list[str],
]:
    operation = random.choice(
        ["+", "-", "×"]
    )

    if operation == "+":
        left = random.randint(
            3,
            20,
        )
        right = random.randint(
            2,
            15,
        )
        answer = left + right

    elif operation == "-":
        left = random.randint(
            8,
            25,
        )
        right = random.randint(
            2,
            left - 1,
        )
        answer = left - right

    else:
        left = random.randint(
            2,
            9,
        )
        right = random.randint(
            2,
            9,
        )
        answer = left * right

    question = (
        f"What is {left} "
        f"{operation} {right}?"
    )

    return (
        question,
        str(answer),
        [],
    )


def generate_number_pattern_challenge(
) -> tuple[
    str,
    str,
    list[str],
]:
    pattern_type = random.choice(
        [
            "ascending",
            "descending",
        ]
    )

    if pattern_type == "ascending":
        start = random.randint(
            1,
            10,
        )
        step = random.randint(
            2,
            7,
        )

        sequence = [
            start + (step * index)
            for index in range(4)
        ]

        answer = sequence[-1] + step

    else:
        step = random.randint(
            2,
            6,
        )

        start = random.randint(
            20,
            40,
        )

        sequence = [
            start - (step * index)
            for index in range(4)
        ]

        answer = sequence[-1] - step

    sequence_text = ", ".join(
        str(number)
        for number in sequence
    )

    question = (
        "What number comes next? "
        f"{sequence_text}, ?"
    )

    return (
        question,
        str(answer),
        [],
    )


def generate_letter_pattern_challenge(
) -> tuple[
    str,
    str,
    list[str],
]:
    alphabet = string.ascii_uppercase

    step = random.choice(
        [1, 2, 3]
    )

    max_start = (
        len(alphabet)
        - (step * 4)
        - 1
    )

    start_index = random.randint(
        0,
        max_start,
    )

    letters = [
        alphabet[
            start_index
            + (step * index)
        ]
        for index in range(4)
    ]

    answer = alphabet[
        start_index + (step * 4)
    ]

    sequence_text = ", ".join(
        letters
    )

    question = (
        "Which letter comes next? "
        f"{sequence_text}, ?"
    )

    return (
        question,
        answer,
        [],
    )


def generate_shape_pattern_challenge(
) -> tuple[
    str,
    str,
    list[str],
]:
    pattern_type = random.choice(
        [
            "alternating",
            "double",
        ]
    )

    first, second = random.sample(
        SHAPE_SYMBOLS,
        2,
    )

    if pattern_type == "alternating":
        sequence = [
            first,
            second,
            first,
            second,
        ]

        answer = first

    else:
        sequence = [
            first,
            first,
            second,
            second,
            first,
            first,
        ]

        answer = second

    distractor_pool = [
        symbol
        for symbol in SHAPE_SYMBOLS
        if symbol != answer
    ]

    distractors = random.sample(
        distractor_pool,
        3,
    )

    options = [
        answer,
        *distractors,
    ]

    random.shuffle(options)

    question = (
        "Which shape comes next? "
        f"{'  '.join(sequence)}  ?"
    )

    return (
        question,
        answer,
        options,
    )


def generate_odd_one_out_challenge(
) -> tuple[
    str,
    str,
    list[str],
]:
    (
        related_items,
        unrelated_items,
    ) = random.choice(
        ODD_ONE_OUT_GROUPS
    )

    odd_item = random.choice(
        unrelated_items
    )

    options = [
        *related_items,
        odd_item,
    ]

    random.shuffle(options)

    question = (
        "Which item does not "
        "belong with the others?"
    )

    return (
        question,
        odd_item,
        options,
    )


def generate_human_challenge(
) -> tuple[
    str,
    str,
    str,
    list[str],
]:
    challenge_type = random.choice(
        [
            "arithmetic",
            "number_pattern",
            "letter_pattern",
            "shape_pattern",
            "odd_one_out",
        ]
    )

    if challenge_type == "arithmetic":
        (
            question,
            answer,
            options,
        ) = generate_arithmetic_challenge()

    elif challenge_type == "number_pattern":
        (
            question,
            answer,
            options,
        ) = (
            generate_number_pattern_challenge()
        )

    elif challenge_type == "letter_pattern":
        (
            question,
            answer,
            options,
        ) = (
            generate_letter_pattern_challenge()
        )

    elif challenge_type == "shape_pattern":
        (
            question,
            answer,
            options,
        ) = (
            generate_shape_pattern_challenge()
        )

    else:
        (
            question,
            answer,
            options,
        ) = (
            generate_odd_one_out_challenge()
        )

    return (
        challenge_type,
        question,
        answer,
        options,
    )


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    normalized_email = normalize_email(
        email
    )

    user = db.scalar(
        select(User).where(
            User.email ==
            normalized_email
        )
    )

    if user is None:
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    if not user.is_active:
        return None

    return user


def find_existing_organization_by_domain(
    db: Session,
    domain: str,
) -> Organization | None:
    organizations = db.scalars(
        select(Organization)
    ).all()

    for organization in organizations:
        if not organization.contact_email:
            continue

        try:
            existing_domain = (
                extract_email_domain(
                    organization.contact_email
                )
            )
        except HTTPException:
            continue

        if existing_domain == domain:
            return organization

    users = db.scalars(
        select(User).where(
            User.organization_id.is_not(
                None
            )
        )
    ).all()

    for user in users:
        try:
            existing_domain = (
                extract_email_domain(
                    user.email
                )
            )
        except HTTPException:
            continue

        if existing_domain != domain:
            continue

        if user.organization is not None:
            return user.organization

    return None


@router.get(
    "/human-challenge",
    response_model=
        HumanChallengeResponse,
)
def create_human_challenge(
    db: Session = Depends(get_db),
) -> HumanChallengeResponse:
    (
        challenge_type,
        question,
        answer,
        options,
    ) = generate_human_challenge()

    challenge_id = (
        secrets.token_urlsafe(32)
    )

    expires_at = (
        utc_now()
        + timedelta(
            minutes=
                CHALLENGE_EXPIRY_MINUTES
        )
    )

    challenge = (
        HumanVerificationChallenge(
            id=challenge_id,
            answer_hash=
                hash_challenge_answer(
                    challenge_id,
                    answer,
                ),
            expires_at=expires_at,
        )
    )

    db.add(challenge)
    db.commit()

    return HumanChallengeResponse(
        challenge_id=challenge_id,
        challenge_type=
            challenge_type,
        question=question,
        options=options,
        expires_in_seconds=(
            CHALLENGE_EXPIRY_MINUTES
            * 60
        ),
    )


def verify_and_consume_challenge(
    db: Session,
    challenge_id: str,
    answer: str,
) -> None:
    challenge = db.scalar(
        select(
            HumanVerificationChallenge
        ).where(
            HumanVerificationChallenge.id
            == challenge_id
        )
    )

    if challenge is None:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Human verification challenge "
                "is invalid. Please request "
                "a new challenge."
            ),
        )

    if challenge.used_at is not None:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Human verification challenge "
                "has already been used. "
                "Please request a new challenge."
            ),
        )

    expires_at = ensure_aware_utc(
        challenge.expires_at
    )

    if utc_now() > expires_at:
        challenge.used_at = utc_now()
        db.commit()

        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Human verification challenge "
                "has expired. Please request "
                "a new challenge."
            ),
        )

    challenge.used_at = utc_now()

    supplied_hash = (
        hash_challenge_answer(
            challenge_id,
            answer,
        )
    )

    correct = hmac.compare_digest(
        supplied_hash,
        challenge.answer_hash,
    )

    db.commit()

    if not correct:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Human verification was not "
                "completed correctly. "
                "Please request a new challenge."
            ),
        )


@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegistrationRequest,
    db: Session = Depends(get_db),
) -> RegistrationResponse:
    normalized_email = normalize_email(
        str(payload.email)
    )

    domain = validate_business_email(
        normalized_email
    )

    # -----------------------------------------------------
    # 1. Validate password policy
    # -----------------------------------------------------

    password_errors = validate_password_strength(
        payload.password,
        email=normalized_email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        organisation_name=
            payload.organisation_name,
    )

    if password_errors:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=" ".join(
                password_errors
            ),
        )

    # -----------------------------------------------------
    # 2. Check whether this email already has an account
    # -----------------------------------------------------

    existing_user = db.scalar(
        select(User).where(
            User.email ==
            normalized_email
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "An account already exists "
                "for this email address."
            ),
        )

    # -----------------------------------------------------
    # 3. Prevent duplicate organisation tenants
    # -----------------------------------------------------

    existing_organization = (
        find_existing_organization_by_domain(
            db=db,
            domain=domain,
        )
    )

    if existing_organization is not None:
        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,
            detail=(
                "An organisation already "
                "exists for this email domain. "
                "Please request access from "
                "your organisation administrator."
            ),
        )

    # -----------------------------------------------------
    # 4. Verify and consume the single-use human challenge
    # -----------------------------------------------------

    verify_and_consume_challenge(
        db=db,
        challenge_id=
            payload.challenge_id,
        answer=
            payload.human_answer,
    )

    # -----------------------------------------------------
    # 5. Prepare organisation and administrator
    # -----------------------------------------------------

    full_name = (
        f"{payload.first_name.strip()} "
        f"{payload.last_name.strip()}"
    ).strip()

    organization = Organization(
        name=
            payload.organisation_name.strip(),
        legal_name=
            payload.organisation_name.strip(),
        contact_email=
            normalized_email,
        status="active",
    )

    db.add(organization)

    # -----------------------------------------------------
    # 6. Create organisation + first administrator
    # -----------------------------------------------------

    try:
        db.flush()

        user = User(
            email=
                normalized_email,
            full_name=
                full_name,
            password_hash=
                hash_password(
                    payload.password
                ),
            role=
                "organization_admin",
            organization_id=
                organization.id,
            is_active=True,
        )

        db.add(user)
        db.commit()

        db.refresh(organization)
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return RegistrationResponse(
        status="registered",
        message=(
            "Organisation account created "
            "successfully."
        ),
        organization_id=
            organization.id,
        user_id=
            user.id,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data:
        OAuth2PasswordRequestForm =
            Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = authenticate_user(
        db=db,
        email=
            form_data.username,
        password=
            form_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Incorrect email or password."
            ),
            headers={
                "WWW-Authenticate":
                    "Bearer"
            },
        )

    access_token = (
        create_access_token(
            subject=str(user.id)
        )
    )

    return TokenResponse(
        access_token=access_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def read_current_user(
    current_user: User = Depends(
        get_current_user
    ),
) -> User:
    return current_user