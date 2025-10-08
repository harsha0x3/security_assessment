from sqlalchemy import ForeignKey, Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base, BaseMixin


class UserPriority(Base, BaseMixin):
    __tablename__ = "user_priorities"

    user_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    target_type: Mapped[str] = mapped_column(String(20))
    target_id: Mapped[str] = mapped_column(String(40))
    priority: Mapped[int] = mapped_column(Integer, default=2)

    __table_args__ = (
        Index(
            "ix_user_priority_unique",
            "user_id",
            "target_type",
            "target_id",
            unique=True,
        ),
    )

    user = relationship("User", back_populates="priorities")
