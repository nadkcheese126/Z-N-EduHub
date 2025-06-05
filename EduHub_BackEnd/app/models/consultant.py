from app.extensions import db

class Consultant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(15), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    shift = db.Column(db.String(255)), nullable=True)
    presence = db.Column(db.String(255)), nullable=True)