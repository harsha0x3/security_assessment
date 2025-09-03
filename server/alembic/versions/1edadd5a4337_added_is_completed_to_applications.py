"""added is_completed to applications

Revision ID: 1edadd5a4337
Revises: c7a4d5b5134a
Create Date: 2025-09-03 16:59:32.825648

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1edadd5a4337'
down_revision: Union[str, Sequence[str], None] = 'c7a4d5b5134a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
