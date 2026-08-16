from email.message import EmailMessage
from email.utils import formataddr
import smtplib
import ssl

from app.core.config import settings


class EmailDeliveryError(Exception):
    """Raised when TrustGRC cannot deliver an email."""


def build_verification_url(
    raw_token: str,
) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")

    return (
        f"{base_url}/verify-email"
        f"?token={raw_token}"
    )


def build_verification_email(
    recipient_email: str,
    recipient_name: str,
    verification_url: str,
) -> EmailMessage:
    message = EmailMessage()

    message["Subject"] = (
        "Verify your TrustGRC AI 360 work email"
    )

    message["To"] = recipient_email

    from_email = (
        settings.SMTP_FROM_EMAIL
        or settings.SMTP_USERNAME
    )

    if not from_email:
        raise EmailDeliveryError(
            "SMTP_FROM_EMAIL or SMTP_USERNAME "
            "must be configured."
        )

    message["From"] = formataddr(
        (
            settings.SMTP_FROM_NAME,
            from_email,
        )
    )

    safe_name = (
        recipient_name.strip()
        or "there"
    )

    expiry_minutes = (
        settings.EMAIL_VERIFICATION_EXPIRY_MINUTES
    )

    plain_text = f"""
Hello {safe_name},

Welcome to TrustGRC AI 360.

Please verify your work email address to activate your organisation account.

Verification link:
{verification_url}

This link expires in {expiry_minutes} minutes and can be used only once.

If you did not create this TrustGRC AI 360 account, you can ignore this email.

TrustGRC AI 360
Governance, Risk & Compliance for Trustworthy AI
""".strip()

    html = f"""
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#f8fafc;
      font-family:Arial,Helvetica,sans-serif;
      color:#0f172a;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        width:100%;
        background:#f8fafc;
        padding:32px 16px;
      "
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width:620px;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-radius:16px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  background:
                    linear-gradient(
                      135deg,
                      #0f172a,
                      #1d4ed8
                    );
                  color:#ffffff;
                "
              >
                <div
                  style="
                    font-size:13px;
                    font-weight:800;
                    letter-spacing:0.08em;
                  "
                >
                  TRUSTGRC AI 360
                </div>

                <div
                  style="
                    margin-top:10px;
                    font-size:24px;
                    font-weight:800;
                    line-height:1.3;
                  "
                >
                  Verify your work email
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:32px;
                "
              >
                <p
                  style="
                    margin:0 0 18px;
                    font-size:16px;
                    line-height:1.7;
                  "
                >
                  Hello {safe_name},
                </p>

                <p
                  style="
                    margin:0 0 18px;
                    color:#475569;
                    font-size:15px;
                    line-height:1.7;
                  "
                >
                  Please verify your work email address
                  to activate your TrustGRC AI 360
                  organisation account.
                </p>

                <p
                  style="
                    margin:28px 0;
                    text-align:center;
                  "
                >
                  <a
                    href="{verification_url}"
                    style="
                      display:inline-block;
                      padding:13px 22px;
                      border-radius:9px;
                      background:#2563eb;
                      color:#ffffff;
                      font-size:14px;
                      font-weight:700;
                      text-decoration:none;
                    "
                  >
                    Verify work email
                  </a>
                </p>

                <p
                  style="
                    margin:0 0 16px;
                    color:#64748b;
                    font-size:13px;
                    line-height:1.7;
                  "
                >
                  This verification link expires in
                  {expiry_minutes} minutes and can be
                  used only once.
                </p>

                <p
                  style="
                    margin:0;
                    color:#94a3b8;
                    font-size:12px;
                    line-height:1.7;
                  "
                >
                  If you did not create this account,
                  no action is required.
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 32px;
                  border-top:1px solid #e2e8f0;
                  color:#94a3b8;
                  font-size:11px;
                  line-height:1.6;
                "
              >
                TrustGRC AI 360<br>
                Governance, Risk & Compliance for
                Trustworthy AI
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""".strip()

    message.set_content(
        plain_text
    )

    message.add_alternative(
        html,
        subtype="html",
    )

    return message


def send_email_message(
    message: EmailMessage,
) -> None:
    if not settings.EMAIL_ENABLED:
        raise EmailDeliveryError(
            "Email delivery is disabled."
        )

    if not settings.SMTP_HOST:
        raise EmailDeliveryError(
            "SMTP_HOST is not configured."
        )

    if not settings.SMTP_USERNAME:
        raise EmailDeliveryError(
            "SMTP_USERNAME is not configured."
        )

    if not settings.SMTP_PASSWORD:
        raise EmailDeliveryError(
            "SMTP_PASSWORD is not configured."
        )

    context = ssl.create_default_context()

    try:
        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=20,
                context=context,
            ) as smtp:
                smtp.login(
                    settings.SMTP_USERNAME,
                    settings.SMTP_PASSWORD,
                )

                smtp.send_message(
                    message
                )

            return

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=20,
        ) as smtp:
            smtp.ehlo()

            if settings.SMTP_USE_TLS:
                smtp.starttls(
                    context=context
                )

                smtp.ehlo()

            smtp.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            smtp.send_message(
                message
            )

    except (
        smtplib.SMTPException,
        OSError,
    ) as exc:
        raise EmailDeliveryError(
            "Unable to deliver the email."
        ) from exc


def send_verification_email(
    recipient_email: str,
    recipient_name: str,
    raw_token: str,
) -> str:
    verification_url = (
        build_verification_url(
            raw_token
        )
    )

    message = (
        build_verification_email(
            recipient_email=
                recipient_email,
            recipient_name=
                recipient_name,
            verification_url=
                verification_url,
        )
    )

    send_email_message(
        message
    )

    return verification_url


def build_password_reset_url(
    raw_token: str,
) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")

    return (
        f"{base_url}/reset-password"
        f"?token={raw_token}"
    )


def build_password_reset_email(
    recipient_email: str,
    recipient_name: str,
    reset_url: str,
) -> EmailMessage:
    message = EmailMessage()

    message["Subject"] = (
        "Reset your TrustGRC AI 360 password"
    )

    message["To"] = recipient_email

    from_email = (
        settings.SMTP_FROM_EMAIL
        or settings.SMTP_USERNAME
    )

    if not from_email:
        raise EmailDeliveryError(
            "SMTP_FROM_EMAIL or SMTP_USERNAME "
            "must be configured."
        )

    message["From"] = formataddr(
        (
            settings.SMTP_FROM_NAME,
            from_email,
        )
    )

    safe_name = (
        recipient_name.strip()
        or "there"
    )

    expiry_minutes = (
        settings.PASSWORD_RESET_EXPIRY_MINUTES
    )

    plain_text = f"""
Hello {safe_name},

We received a request to reset the password for your TrustGRC AI 360 account.

Use the secure link below to choose a new password:

{reset_url}

This link expires in {expiry_minutes} minutes and can be used only once.

If you did not request a password reset, you can ignore this email. Your existing password will remain unchanged.

TrustGRC AI 360
Governance, Risk & Compliance for Trustworthy AI
""".strip()

    html = f"""
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#f8fafc;
      font-family:Arial,Helvetica,sans-serif;
      color:#0f172a;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        width:100%;
        background:#f8fafc;
        padding:32px 16px;
      "
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width:620px;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-radius:16px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  background:
                    linear-gradient(
                      135deg,
                      #0f172a,
                      #1d4ed8
                    );
                  color:#ffffff;
                "
              >
                <div
                  style="
                    font-size:13px;
                    font-weight:800;
                    letter-spacing:0.08em;
                  "
                >
                  TRUSTGRC AI 360
                </div>

                <div
                  style="
                    margin-top:10px;
                    font-size:24px;
                    font-weight:800;
                    line-height:1.3;
                  "
                >
                  Reset your password
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:32px;
                "
              >
                <p
                  style="
                    margin:0 0 18px;
                    font-size:16px;
                    line-height:1.7;
                  "
                >
                  Hello {safe_name},
                </p>

                <p
                  style="
                    margin:0 0 18px;
                    color:#475569;
                    font-size:15px;
                    line-height:1.7;
                  "
                >
                  We received a request to reset
                  the password for your TrustGRC
                  AI 360 account.
                </p>

                <p
                  style="
                    margin:28px 0;
                    text-align:center;
                  "
                >
                  <a
                    href="{reset_url}"
                    style="
                      display:inline-block;
                      padding:13px 22px;
                      border-radius:9px;
                      background:#2563eb;
                      color:#ffffff;
                      font-size:14px;
                      font-weight:700;
                      text-decoration:none;
                    "
                  >
                    Reset password
                  </a>
                </p>

                <p
                  style="
                    margin:0 0 16px;
                    color:#64748b;
                    font-size:13px;
                    line-height:1.7;
                  "
                >
                  This password-reset link expires in
                  {expiry_minutes} minutes and can be
                  used only once.
                </p>

                <p
                  style="
                    margin:0;
                    color:#94a3b8;
                    font-size:12px;
                    line-height:1.7;
                  "
                >
                  If you did not request this password
                  reset, no action is required. Your
                  existing password will remain unchanged.
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 32px;
                  border-top:1px solid #e2e8f0;
                  color:#94a3b8;
                  font-size:11px;
                  line-height:1.6;
                "
              >
                TrustGRC AI 360<br>
                Governance, Risk & Compliance for
                Trustworthy AI
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
""".strip()

    message.set_content(
        plain_text
    )

    message.add_alternative(
        html,
        subtype="html",
    )

    return message


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str,
    raw_token: str,
) -> str:
    reset_url = (
        build_password_reset_url(
            raw_token
        )
    )

    message = (
        build_password_reset_email(
            recipient_email=
                recipient_email,
            recipient_name=
                recipient_name,
            reset_url=
                reset_url,
        )
    )

    send_email_message(
        message
    )

    return reset_url