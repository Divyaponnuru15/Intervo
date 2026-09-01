"""Create job analyses table

Revision ID: e25f623109d1
Revises: db3f808b81f3
Create Date: 2026-09-01 18:48:40.578707

"""

from alembic import op
import sqlalchemy as sa


# ============================================================
# REVISION IDENTIFIERS
# ============================================================

revision = "e25f623109d1"

down_revision = "db3f808b81f3"

branch_labels = None

depends_on = None


# ============================================================
# UPGRADE
# ============================================================

def upgrade():

    # --------------------------------------------------------
    # CREATE JOB ANALYSES TABLE
    # --------------------------------------------------------

    op.create_table(

        "job_analyses",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "resume_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "job_description",
            sa.Text(),
            nullable=False
        ),

        sa.Column(
            "match_score",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "matching_skills",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "partial_skills",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "missing_skills",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "priority_skills",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "resume_suggestions",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "overall_assessment",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )

    )


    # --------------------------------------------------------
    # CREATE INDEXES
    # --------------------------------------------------------

    with op.batch_alter_table(
        "job_analyses",
        schema=None
    ) as batch_op:

        batch_op.create_index(
            batch_op.f(
                "ix_job_analyses_resume_id"
            ),
            ["resume_id"],
            unique=False
        )

        batch_op.create_index(
            batch_op.f(
                "ix_job_analyses_user_id"
            ),
            ["user_id"],
            unique=False
        )


# ============================================================
# DOWNGRADE
# ============================================================

def downgrade():

    # --------------------------------------------------------
    # REMOVE INDEXES
    # --------------------------------------------------------

    with op.batch_alter_table(
        "job_analyses",
        schema=None
    ) as batch_op:

        batch_op.drop_index(
            batch_op.f(
                "ix_job_analyses_user_id"
            )
        )

        batch_op.drop_index(
            batch_op.f(
                "ix_job_analyses_resume_id"
            )
        )


    # --------------------------------------------------------
    # REMOVE TABLE
    # --------------------------------------------------------

    op.drop_table(
        "job_analyses"
    )