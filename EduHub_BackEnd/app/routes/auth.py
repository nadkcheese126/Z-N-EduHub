from flask import Blueprint, request, jsonify
from app.models import Admin, User, Consultant
from app.extensions import db
from app.utils.recommendation_helper import get_recommendations
from app.utils.time_slot_generator import generate_consultant_time_slots
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, get_jwt, unset_jwt_cookies

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register/user', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')  # Get name from request data

    if any([
        Admin.query.filter_by(email=email).first(),
        User.query.filter_by(email=email).first(),
        Consultant.query.filter_by(email=email).first()
    ]):
        return jsonify({'error': 'Email already exists'}), 400

    user = User(
        email=email,
        name=name,
        phone=data.get('phone'),
        address=data.get('address'),
        areas_of_interest=data.get('areas_of_interest'),
        degree_level=data.get('degree_level'),
        mode=data.get('mode')
    )

    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    recommendations = get_recommendations(
        areas_of_interest=user.areas_of_interest,
        degree_level=user.degree_level,
        mode=user.mode
    )
    
    response_data = {
        'message': 'user registered successfully',
        'user_id': user.id,
        'recommendations': recommendations,
        'recommendation_count': len(recommendations)
    }
    
    return jsonify(response_data), 201

# 🔐 LOGIN
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = (
        Admin.query.filter_by(email=email).first() or
        User.query.filter_by(email=email).first() or
        Consultant.query.filter_by(email=email).first()
    )
    
    if user and user.check_password(password):
        access_token = create_access_token(
            identity=str(user.id),  # Explicitly convert user.id to string
            additional_claims={'user_type': user.user_type}
        )
        
        response_data = {
            'message': 'Login successful',
            'user_type': user.user_type,
            'user_id': user.id, # Keep user_id as integer in the JSON response body for convenience
            'name': user.name,  # Include the user's name in the response
            'access_token': access_token  # Include token in response for non-HttpOnly fallback
        }
        
        # Add recommendations for user type
        if user.user_type == 'user':
            recommendations = get_recommendations(
                areas_of_interest=user.areas_of_interest,
                degree_level=user.degree_level,
                mode=user.mode
            )
            response_data['recommendations'] = recommendations
            response_data['recommendation_count'] = len(recommendations)
        
        response = jsonify(response_data)
        
        # Set the JWT token in an HTTP-only cookie
        set_access_cookies(response, access_token)
        
        # Also set user_id and user_type in regular cookies for frontend access
        response.set_cookie('user_id', str(user.id), max_age=86400, samesite=None)  # 24 hours
        response.set_cookie('user_type', user.user_type, max_age=86400, samesite=None)  # 24 hours
        if user.name:
            response.set_cookie('user_name', user.name, max_age=86400, samesite=None)  # 24 hours
        
        # For consultant type, specifically set consultantId
        if user.user_type == 'consultant':
            response.set_cookie('consultantId', str(user.id), max_age=86400, samesite=None)  # 24 hours
            
        return response, 200
    return jsonify({'error': 'Invalid email or password'}), 401

# Logout endpoint to clear JWT cookies
@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Successfully logged out'})
    unset_jwt_cookies(response)
    
    # Also clear other cookies
    response.set_cookie('user_id', '', max_age=0, samesite=None)
    response.set_cookie('user_type', '', max_age=0, samesite=None)
    response.set_cookie('consultantId', '', max_age=0, samesite=None)
    
    return response, 200
