"""add session id foreign key to interview questions

Revision ID: 80647aca6796
Revises: 053ececb7368
Create Date: 2026-07-31 17:31:04.179192

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '80647aca6796'
down_revision = '053ececb7368'
branch_labels = None
depends_on = None


def upgrade():
    # Add session_id column temporarily allowing NULL values
    with op.batch_alter_table('interview_questions', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('session_id', sa.Integer(), nullable=True)
        )

        batch_op.create_foreign_key(
            'fk_interview_questions_session',
            'interview_sessions',
            ['session_id'],
            ['id']
        )
def downgrade():
    with op.batch_alter_table('interview_questions', schema=None) as batch_op:
        batch_op.drop_constraint(
            'fk_interview_questions_session',
            type_='foreignkey'
        )
        batch_op.drop_column('session_id')
    # ### end Alembic commands ###
