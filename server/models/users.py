import re
from datetime import datetime
import pyotp

from db.base import Base, BaseMixin
from sqlalchemy import JSON, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, validates
from sqlalchemy.ext.mutable import MutableList

from server.services.auth.utils import (
    generate_recovery_codes,
    generate_totp_secret,
    hash_password,
    verify_password,
    build_otpauth_uri,
)


class User(Base, BaseMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)
    role: Mapped[str] = mapped_column(String(15), nullable=False, default="user")

    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[str] = mapped_column(String(100), nullable=True)  # base32 secret
    mfa_recovery_codes: Mapped[list[str]] = mapped_column(
        MutableList.as_mutable(JSON), nullable=True
    )
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)

    def set_password(self, plain_password: str) -> None:
        self.password_hash = hash_password(plain_password)

    def verify_password(self, plain_password: str) -> bool:
        return verify_password(plain_password, self.password_hash)

    def enable_mfa(self):
        """Generate TOTP secret and initial recovery codes."""
        self.mfa_secret = generate_totp_secret()
        plain, hashed = generate_recovery_codes()
        self.mfa_recovery_codes = hashed
        self.mfa_enabled = True
        return plain

    def get_mfa_uri(self):
        if not self.mfa_secret:
            raise ValueError("MFA is not set up")
        return build_otpauth_uri(
            secret=self.mfa_secret, email=self.email, issuer="Security Assessment"
        )

    def verify_mfa_code(self, code: str) -> bool:
        """Verify TOTP code."""
        if not self.mfa_secret:
            return False
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(code)

    def use_recovery_code(self, code: str) -> bool:
        """Check recovery code and remove if valid."""
        for idx, hashed in enumerate(self.mfa_recovery_codes or []):
            if verify_password(code, hashed):
                # remove used code
                self.mfa_recovery_codes.pop(idx)
                return True
        return False

    @validates("email")
    def validate_email(self, key, email):
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, email):
            raise ValueError("Invalid Email Format")
        return email.lower()

    @validates("username")
    def validate_username(self, key, username):
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(username) > 50:
            raise ValueError("Username cannot exceed 50 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", username):
            raise ValueError(
                "Username can only contain letters, numbers, and underscores"
            )
        return username.lower()

    def get_full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        return f"{self.username}"

    def to_dict_safe(self):
        # Return user data without sensitive information
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
