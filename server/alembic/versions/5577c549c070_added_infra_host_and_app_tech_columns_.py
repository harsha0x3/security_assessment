"""Added infra_host and app_tech columns to app(nullable)

Revision ID: 5577c549c070
Revises:
Create Date: 2025-08-30 20:41:39.599513

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "5577c549c070"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "applications", sa.Column("infra_host", sa.String(100), nullable=True)
    )
    op.add_column("applications", sa.Column("app_tech", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "infra_host")
    op.drop_column("applications", "app_tech")
