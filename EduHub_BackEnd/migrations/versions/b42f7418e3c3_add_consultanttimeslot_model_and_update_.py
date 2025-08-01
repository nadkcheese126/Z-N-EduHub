"""Add ConsultantTimeSlot model and update Booking model

Revision ID: b42f7418e3c3
Revises: e5d049f10e33
Create Date: 2025-06-22 14:33:45.183342

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'b42f7418e3c3'
down_revision = 'e5d049f10e33'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('consultant_time_slot',
    sa.Column('slot_id', sa.Integer(), nullable=False),
    sa.Column('consultant_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('start_time', sa.String(length=10), nullable=False),
    sa.Column('end_time', sa.String(length=10), nullable=False),
    sa.Column('is_available', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['consultant_id'], ['consultants.id'], ),
    sa.PrimaryKeyConstraint('slot_id')
    )
    op.create_table('bookings',
    sa.Column('booking_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('consultant_id', sa.Integer(), nullable=False),
    sa.Column('time_slot_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=True),
    sa.Column('booking_date', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['consultant_id'], ['consultants.id'], ),
    sa.ForeignKeyConstraint(['time_slot_id'], ['consultant_time_slot.slot_id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('booking_id')
    )
    op.drop_table('booking')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('booking',
    sa.Column('booking_id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('user_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('consultant_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('date', mysql.DATETIME(), nullable=False),
    sa.Column('time', mysql.VARCHAR(length=50), nullable=False),
    sa.Column('status', mysql.VARCHAR(length=50), nullable=True),
    sa.ForeignKeyConstraint(['consultant_id'], ['consultants.id'], name=op.f('booking_ibfk_1')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('booking_ibfk_2')),
    sa.PrimaryKeyConstraint('booking_id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.drop_table('bookings')
    op.drop_table('consultant_time_slot')
    # ### end Alembic commands ###
