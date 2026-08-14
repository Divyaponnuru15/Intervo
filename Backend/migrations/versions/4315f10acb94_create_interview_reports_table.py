"""create interview reports table

Revision ID: 4315f10acb94
Revises: 80647aca6796
Create Date: 2026-07-31 18:06:19.454451

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4315f10acb94'
down_revision = '80647aca6796'
branch_labels = None
depends_on = None


def upgrade():

    op.create_table(
        'interview_reports',

        sa.Column(
            'id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'session_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'user_id',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'total_questions',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'answered_questions',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'average_score',
            sa.Float(),
            nullable=True
        ),

        sa.Column(
            'strengths',
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            'improvements',
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            'recommendation',
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=True
        ),

        sa.ForeignKeyConstraint(
            ['session_id'],
            ['interview_sessions.id']
        ),

        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id']
        ),

        sa.PrimaryKeyConstraint(
            'id'
        )
    )


def downgrade():

    op.drop_table(
        'interview_reports'
    )