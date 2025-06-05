from flask import Blueprint, request, jsonify
from app.models import Admin, User, Consultant
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

# 🔐 REGISTER
@auth_bp.route('/register/<user_type>', methods=['POST'])
def register(user_type):
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Check if email exists in any user model
    if any([
        Admin.query.filter_by(email=email).first(),
        User.query.filter_by(email=email).first(),
        Consultant.query.filter_by(email=email).first()
    ]):
        return jsonify({'error': 'Email already exists'}), 400

    if user_type == 'admin':
        user = Admin(email=email)
    elif user_type == 'user':
        user = User(
            email=email,
            phone=data.get('phone'),
            address=data.get('address'),
            areas_of_interest=data.get('areas_of_interest'),
            degree_level=data.get('degree_level'),
            mode=data.get('mode')
        )
    elif user_type == 'consultant':
        user = Consultant(
            email=email,
            phone=data.get('phone'),
            address=data.get('address'),
            shift=data.get('shift'),
            presence=data.get('presence')
        )
    else:
        return jsonify({'error': 'Invalid user type'}), 400

    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': f'{user_type} registered successfully'}), 201

# 🔐 LOGIN
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = (Admin.query.filter_by(email=email).first() or
            User.query.filter_by(email=email).first() or
            Consultant.query.filter_by(email=email).first())

    if user and user.check_password(password):
        return jsonify({
            'message': 'Login successful',
            'user_type': user.user_type,
            'user_id': user.id
        })
    return jsonify({'error': 'Invalid email or password'}), 401
