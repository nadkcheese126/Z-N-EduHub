from app.extensions import db
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

# ------------------- BASE USER -------------------
class BaseUser(db.Model):
    __tablename__ = 'base_users'

    id = db.Column(db.Integer, primary_key=True)
    user_type = db.Column(db.String(50))
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

    __mapper_args__ = {
        'polymorphic_identity': 'consultant'
    }
