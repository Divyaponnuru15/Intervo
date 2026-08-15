"""Add ATS analysis fields to resumes

Revision ID: db3f808b81f3
Revises: 4315f10acb94
Create Date: 2026-08-14 18:32:40.923430

"""

from alembic import op
import sqlalchemy as sa


# =====================================================
# REVISION IDENTIFIERS
# =====================================================

revision = "db3f808b81f3"

down_revision = "4315f10acb94"

branch_labels = None

depends_on = None


# =====================================================
# UPGRADE
# =====================================================

def upgrade():

    with op.batch_alter_table(
        "resumes",
        schema=None
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                "ats_score",
                sa.Integer(),
                nullable=True
            )
        )

        batch_op.add_column(
            sa.Column(
                "ats_analysis",
                sa.JSON(),
                nullable=True
            )
        )


# =====================================================
# DOWNGRADE
# =====================================================

def downgrade():

    with op.batch_alter_table(
        "resumes",
        schema=None
    ) as batch_op:

        batch_op.drop_column(
            "ats_analysis"
        )

        batch_op.drop_column(
            "ats_score"
        )