from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session


class Application(Base, BaseMixin):
    __tablename__ = "applications"

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    platform: Mapped[str] = mapped_column(String(36), nullable=False)
    region: Mapped[str] = mapped_column(String(36), nullable=False)
    creator_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    owner_name: Mapped[str] = mapped_column(String(100), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(64), nullable=False)
    infra_host: Mapped[str] = mapped_column(String(100), nullable=True)
    app_tech: Mapped[str] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(default=False)

    creator = relationship("User", back_populates="applications")
    checklists = relationship("Checklist", back_populates="app")

    def refresh_completion_status(self):
        """Recalculate is_completed based on checklists."""
        self.is_completed = all(c.is_completed for c in self.checklists)

    def __repr__(self) -> str:
        return f"<app_id={self.id}, app_name={self.id}>"
