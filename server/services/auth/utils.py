import bcrypt
import pyotp
import qrcode
import io
import base64
import os


class PasswordConfig:
    SALT_ROUNDS = 12
    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_NUMBERS = True
    REQUIRE_SPECIAL = True


def hash_password(plain_password: str) -> str:
    # if not _validate_password_strength(plain_password):
    #     raise ValueError("Password doesn't meet requirements")
    salt = bcrypt.gensalt(rounds=PasswordConfig.SALT_ROUNDS)
    password_bytes = plain_password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, salt)

    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def build_otpauth_uri(secret: str, email: str, issuer: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)


def qr_png_data_url(data: str) -> str:
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def generate_recovery_codes(n: int = 8) -> tuple[list[str], list[str]]:
    plain = []
    for _ in range(n):
        code = base64.b32encode(os.urandom(5)).decode().strip("=")

        plain.append(f"{code[:4]}-{code[4:8]}")

    hashed = [hash_password(c) for c in plain]
    return plain, hashed


# Password strength validation
def _validate_password_strength(password: str) -> bool:
    config = PasswordConfig()

    # Check minimum length
    if len(password) < config.MIN_LENGTH:
        return False

    # Check for uppercase
    if config.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False

    # Check for lowercase
    if config.REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False

    # Check for numbers
    if config.REQUIRE_NUMBERS and not any(c.isdigit() for c in password):
        return False

    # Check for special characters
    if config.REQUIRE_SPECIAL and not any(
        c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password
    ):
        return False

    return True


# Generate password requirements message
def get_password_requirements() -> str:
    return """Password must:
    - Be at least 8 characters long
    - Contain uppercase letters
    - Contain lowercase letters
    - Contain numbers
    - Contain special characters"""
