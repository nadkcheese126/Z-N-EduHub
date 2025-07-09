from flask import Blueprint, request, jsonify
from flasgger import swag_from
from app.models import Admin, User, Consultant
from app.extensions import db
from app.utils.recommendation_helper import get_recommendations
from app.utils.time_slot_generator import generate_consultant_time_slots
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, get_jwt, unset_jwt_cookies

auth_bp = Blueprint('auth', __name__)

# 🔐 REGISTER
@auth_bp.route('/register/<user_type>', methods=['POST'])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Register a new user, admin, or consultant.',
    'description': 'Creates a new account based on the specified user type. For "user" type, it also returns initial program recommendations.',
    'parameters': [
        {
            'name': 'user_type',
            'in': 'path',
            'required': True,
            'description': 'Type of user to register.',
            'schema': {
                'type': 'string',
                'enum': ['user', 'admin', 'consultant']
            }
        }
    ],
    'requestBody': {
        'description': 'User registration details. Fields vary by user_type.',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'oneOf': [
                        {'$ref': '#/components/schemas/UserRegistrationRequest'},
                        {'$ref': '#/components/schemas/AdminRegistrationRequest'},
                        {'$ref': '#/components/schemas/ConsultantRegistrationRequest'}
                    ]
                },
                'examples': {
                    'user': {
                        'summary': 'Example user registration',
                        'value': {
                            'name': 'John Doe',
                            'email': 'testuser@example.com', 'password': 'password123',
                            'phone': '123-456-7890', 'address': '123 Main St',
                            'areas_of_interest': ['AI', 'Data Science'],
                            'degree_level': 'Masters', 'mode': 'Online'
                        }
                    },
                    'admin': {
                        'summary': 'Example admin registration',
                        'value': {'name': 'Admin User', 'email': 'admin@example.com', 'password': 'adminpass'}
                    },
                    'consultant': {
                        'summary': 'Example consultant registration',
                        'value': {
                            'name': 'Jane Smith',
                            'email': 'consultant@example.com', 'password': 'consultantpass',
                            'phone': '987-654-3210', 'address': '456 Oak Ave',
                            'shift': 'Morning', 'presence': 'Online'
                        }
                    }
                }
            }
        }
    },
    'responses': {
        '201': {
            'description': 'Registration successful. Returns user ID and, for "user" type, program recommendations.',
            'content': {
                'application/json': {
                    'schema': {
                       'oneOf': [
                           {'$ref': '#/components/schemas/UserRegistrationSuccessResponse'},
                           {'$ref': '#/components/schemas/BaseRegistrationSuccessResponse'}
                       ]
                    }
                }
            }
        },
        '400': {
            'description': 'Invalid input (e.g., email exists, invalid user type, missing fields).',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        }
    }
})
def register(user_type):
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

    if user_type == 'admin':
        user = Admin(email=email, name=name)
    elif user_type == 'user':
        user = User(
            email=email,
            name=name,
            phone=data.get('phone'),
            address=data.get('address'),
            areas_of_interest=data.get('areas_of_interest'),
            degree_level=data.get('degree_level'),
            mode=data.get('mode')
        )
    elif user_type == 'consultant':
        # Get employment type with default to part-time
        employment_type = data.get('employment_type', 'part-time')
        if employment_type not in ['part-time', 'full-time']:
            return jsonify({'error': 'Invalid employment type. Must be "part-time" or "full-time"'}), 400
            
        user = Consultant(
            email=email,
            name=name,
            phone=data.get('phone'),
            address=data.get('address'),
            shift=data.get('shift'),
            presence=data.get('presence'),
            employment_type=employment_type
        )
    else:
        return jsonify({'error': 'Invalid user type'}), 400

    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    # If this is a consultant, generate time slots automatically
    if user_type == 'consultant':
        # Generate time slots for the next 4 weeks
        slots_created = generate_consultant_time_slots(consultant_id=user.id, num_weeks=4)
    
    response_data = {
        'message': f'{user_type} registered successfully',
        'user_id': user.id
    }
    if user_type == 'user':
        recommendations = get_recommendations(
            areas_of_interest=user.areas_of_interest,
            degree_level=user.degree_level,
            mode=user.mode
        )
        response_data['recommendations'] = recommendations
        response_data['recommendation_count'] = len(recommendations)
    
    return jsonify(response_data), 201

# 🔐 LOGIN
@auth_bp.route('/login', methods=['POST'])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Logs in an existing user, admin, or consultant.',
    'description': 'Authenticates a user and returns a JWT token in an HttpOnly cookie.',
    'requestBody': {
        'description': 'Login credentials.',
        'required': True,
        'content': {
            'application/json': {
                'schema': {'$ref': '#/components/schemas/LoginRequest'}
            }
        }
    },
    'responses': {
        '200': {
            'description': 'Login successful. JWT token is set in an HttpOnly cookie.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/LoginSuccessResponse'}
                }
            },
            'headers': {
                'Set-Cookie': {
                    'description': 'Contains the JWT access token in an HttpOnly cookie (e.g., access_token_cookie=...).',
                    'schema': {'type': 'string'}
                }
            }
        },
        '401': {
            'description': 'Invalid email or password.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        },
        '422': {
            'description': 'Unprocessable Entity - e.g. problem with token creation if identity is wrong type.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        }
    }
})
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

# Example of a protected route
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Access a protected route (example).',
    'description': 'This is an example of a route protected by JWT. Requires a valid token in cookies.',
    'security': [{'BearerAuth': []}],
    'responses': {
        '200': {
            'description': 'Successfully accessed protected data.',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'logged_in_as': {
                                'type': 'object',
                                'properties': {
                                    'id': {'type': 'integer', 'description': 'User ID from JWT identity (sub claim)'},
                                    'type': {'type': 'string', 'description': 'User type from JWT additional_claims'}
                                },
                                'example': {'id': 1, 'type': 'user'}
                            },
                            'message': {'type': 'string', 'example': 'Access granted to protected route.'}
                        }
                    }
                }
            }
        },
        '401': {
            'description': 'Unauthorized - Missing or invalid token (e.g. cookie not sent or token expired).',
             'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        },
        '422': {
            'description': 'Unprocessable Entity - Token is invalid (e.g. malformed).',
             'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        }
    }
})
def protected():
    current_user_id_str = get_jwt_identity() # This will be the string representation of user.id
    jwt_claims = get_jwt()
    user_type = jwt_claims.get('user_type', 'unknown')

    # Get user info including name
    user = None
    if user_type == 'admin':
        user = Admin.query.get(int(current_user_id_str))
    elif user_type == 'user':
        user = User.query.get(int(current_user_id_str))
    elif user_type == 'consultant':
        user = Consultant.query.get(int(current_user_id_str))

    user_info = {
        'id': current_user_id_str, 
        'type': user_type
    }
    
    if user and user.name:
        user_info['name'] = user.name

    return jsonify(
        logged_in_as=user_info,
        message="Access granted to protected route."
    ), 200

# Logout endpoint to clear JWT cookies
@auth_bp.route('/logout', methods=['POST'])
@swag_from({
    'tags': ['Authentication'],
    'summary': 'Logout and clear auth cookies',
    'description': 'Clears JWT and other auth cookies',
    'responses': {
        '200': {
            'description': 'Successfully logged out',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string', 'example': 'Successfully logged out'}
                        }
                    }
                }
            }
        }
    }
})
def logout():
    response = jsonify({'message': 'Successfully logged out'})
    unset_jwt_cookies(response)
    
    # Also clear other cookies
    response.set_cookie('user_id', '', max_age=0, samesite=None)
    response.set_cookie('user_type', '', max_age=0, samesite=None)
    response.set_cookie('consultantId', '', max_age=0, samesite=None)
    
    return response, 200
