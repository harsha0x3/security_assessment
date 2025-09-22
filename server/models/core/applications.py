from sqlalchemy import ForeignKey, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, BaseMixin


class Application(Base, BaseMixin):
    __tablename__ = "applications"

    name: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    platform: Mapped[str] = mapped_column(String(512), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=True)
    creator_id: Mapped[str] = mapped_column(String(40), ForeignKey("users.id"))
    owner_name: Mapped[str] = mapped_column(String(512), nullable=True)
    provider_name: Mapped[str] = mapped_column(String(666), nullable=True)
    infra_host: Mapped[str] = mapped_column(String(512), nullable=True)
    app_tech: Mapped[str] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=2)
    department: Mapped[str] = mapped_column(String(128), nullable=True)
    is_completed: Mapped[bool] = mapped_column(default=False)

    creator = relationship("User", back_populates="applications")
    checklists = relationship("Checklist", back_populates="app")

    def refresh_completion_status(self):
        """Recalculate is_completed based on checklists."""
        self.is_completed = all(c.is_completed for c in self.checklists)

    def __repr__(self) -> str:
        return f"<app_id={self.id}, app_name={self.id}>"
