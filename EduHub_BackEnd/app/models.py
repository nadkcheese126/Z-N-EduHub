import datetime
import re
import pandas as pd
from app.extensions import db
from flask_bcrypt import Bcrypt
import pandas as pd
import re

bcrypt = Bcrypt()

# ------------------- BASE USER -------------------
class BaseUser(db.Model):
    __tablename__ = 'base_users'
    _table_args__ = {'extend_existing': True}  # Allow redefinition if the table already exists
    
    id = db.Column(db.Integer, primary_key=True)
    user_type = db.Column(db.String(50))
    name = db.Column(db.String(100), nullable=True)  # Added name field
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'base',
        'polymorphic_on': user_type
    }

    def set_password(self, raw_password):
        self.password = bcrypt.generate_password_hash(raw_password).decode('utf-8')

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password, raw_password)

# ------------------- ADMIN MODEL -------------------
class Admin(BaseUser):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, db.ForeignKey('base_users.id'), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'admin'
    }

# ------------------- USER MODEL -------------------
class User(BaseUser):
    __tablename__ = 'users'

    id = db.Column(db.Integer, db.ForeignKey('base_users.id'), primary_key=True)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    areas_of_interest = db.Column(db.String(255), nullable=True)
    degree_level = db.Column(db.String(50), nullable=True)
    mode = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __mapper_args__ = {
        'polymorphic_identity': 'user'
    }

# ------------------- CONSULTANT MODEL -------------------
class Consultant(BaseUser):
    __tablename__ = 'consultants'

    id = db.Column(db.Integer, db.ForeignKey('base_users.id'), primary_key=True)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    shift = db.Column(db.String(255), nullable=True)
    presence = db.Column(db.String(255), nullable=True)
    employment_type = db.Column(db.String(20), default='part-time')  # 'part-time' or 'full-time'

    __mapper_args__ = {
        'polymorphic_identity': 'consultant'
    }
# ------------------- PROGRAMS MODEL -------------------
class Program(db.Model):
    # Using program_id as the primary key as it appears unique in your Excel
    program_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.String(50), nullable=True) # Storing as string as it contains "years" or "year"
    uni_id = db.Column(db.Integer, nullable=False)
    degree_level = db.Column(db.String(100), nullable=True)
    mode = db.Column(db.String(50), nullable=True)
    fee = db.Column(db.Float, nullable=True) # Storing cleaned fee as a float
    requirements = db.Column(db.Text, nullable=True)
    scholarships = db.Column(db.String(255), nullable=True)
    area_of_study = db.Column(db.String(255), nullable=False)
    date_added = db.Column(db.DateTime, server_default=db.func.now())
    def __repr__(self):
        return f"Program('{self.name}', '{self.degree_level}', '{self.area_of_study}')"
# ------------------- UNIVERSITY MODEL -------------------
class University(db.Model):
    # Using uni_id as the primary key as it appears unique in your Excel
    uni_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text, nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    date_added = db.Column(db.DateTime, server_default=db.func.now())

    def __repr__(self):
        return f"University('{self.name}', '{self.email}')"
    
class ConsultantTimeSlot(db.Model):
    __tablename__ = 'consultant_time_slot'
    slot_id = db.Column(db.Integer, primary_key=True)
    consultant_id = db.Column(db.Integer, db.ForeignKey('consultants.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # Format: "HH:MM" in 24-hour
    end_time = db.Column(db.String(10), nullable=False)    # Format: "HH:MM" in 24-hour
    is_available = db.Column(db.Boolean, default=True)     # Track if the slot is available
    
    consultant = db.relationship('Consultant', backref='time_slots')

    def __repr__(self):
        return f"TimeSlot(Consultant: {self.consultant_id}, Date: {self.date}, Time: {self.start_time}-{self.end_time}, Available: {self.is_available})"


class Booking(db.Model):
    __tablename__ = 'bookings'
    booking_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    consultant_id = db.Column(db.Integer, db.ForeignKey('consultants.id'), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey('consultant_time_slot.slot_id'), nullable=False)
    status = db.Column(db.String(50), default='Pending')  # Status can be 'Pending', 'Confirmed', 'Cancelled'
    booking_date = db.Column(db.DateTime, server_default=db.func.now())  # When the booking was made
    
    user = db.relationship('User', backref='bookings')
    consultant = db.relationship('Consultant', backref='bookings')
    time_slot = db.relationship('ConsultantTimeSlot', backref='booking', uselist=False)

    def __repr__(self):
        return f"Booking(User: {self.user_id}, Consultant: {self.consultant_id}, Status: {self.status})"

# Helper function to clean fee string to float
def clean_fee(fee_str):
    if pd.isna(fee_str): # Check for NaN or None
        return None
    # Convert to string to ensure .replace() works, then clean
    fee_str = str(fee_str).upper()
    # Remove "LKR", "KR", commas, and trim whitespace
    cleaned_fee = re.sub(r'[LKR\s,]', '', fee_str)
    try:
        return float(cleaned_fee)
    except ValueError:
        return None # Return None if conversion fails