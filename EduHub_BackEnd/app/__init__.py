from flask import Flask
from flasgger import Swagger
from .extensions import db, bcrypt # Make sure bcrypt is initialized if used
from .config import Config # Your application's config
from flask_jwt_extended import JWTManager # Add this import
from flask_migrate import Migrate # Add this import
from flask_cors import CORS # Add this import

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app) # Initialize bcrypt if you use it for password hashing
    Migrate(app, db) # Initialize Flask-Migrate
    
    # Enable CORS for all routes with proper preflight handling
    CORS(app, 
         resources={r"/api/*": {"origins": "http://localhost:3000"}},  # Specify the exact frontend origin
         supports_credentials=True,  # Important for cookies
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])

    # Initialize JWTManager
    jwt = JWTManager(app)

    # Swagger Configuration
    app.config['SWAGGER'] = {
        'title': 'EduHub API',
        'uiversion': 3, # Use OpenAPI 3
        'openapi': '3.0.3', # More specific OpenAPI version
        'version': '1.0.0',
        'description': 'API for EduHub, an online educational consultancy firm. Provides user registration, login, and program recommendations.',
        'termsOfService': 'http://example.com/terms', # Replace with your actual ToS URL
        'contact': {
            'name': 'EduHub API Support',
            'url': 'http://example.com/support',
            'email': 'support@example.com'
        },
        'license': {
            'name': 'MIT License',
            'url': 'https://opensource.org/licenses/MIT' # Example license
        },
        'components': {
            'securitySchemes': {
                'BearerAuth': {
                    'type': 'http',
                    'scheme': 'bearer',
                    'bearerFormat': 'JWT'
                }
            },
            'schemas': {
                'ErrorResponse': {
                    'type': 'object',
                    'properties': {
                        'error': {'type': 'string', 'example': 'Error message content'}
                    }
                },
                'LoginRequest': {
                    'type': 'object',
                    'required': ['email', 'password'],
                    'properties': {
                        'email': {'type': 'string', 'format': 'email', 'example': 'user@example.com'},
                        'password': {'type': 'string', 'format': 'password', 'example': 'strongpassword123'}
                    }
                },
                'LoginSuccessResponse': {
                    'type': 'object',
                    'properties': {
                        'message': {'type': 'string', 'example': 'Login successful'},
                        'user_type': {'type': 'string', 'enum': ['admin', 'user', 'consultant'], 'example': 'user'},
                        'user_id': {'type': 'integer', 'example': 1}
                        # Token will be in an HttpOnly cookie, so not in response body
                    }
                },
                'ProgramRecommendation': {
                    'type': 'object',
                    'properties': {
                        'program_id': {'type': 'integer', 'example': 101},
                        'program_name': {'type': 'string', 'example': 'Bachelor of Science in Computer Science'},
                        'university': {'type': 'string', 'example': 'Tech University'},
                        'description': {'type': 'string', 'example': 'A comprehensive program focusing on software development and computer theory.'},
                        'degree_level': {'type': 'string', 'example': 'Bachelors'},
                        'mode': {'type': 'string', 'example': 'Online'},
                        'duration': {'type': 'string', 'example': '4 years'},
                        'tuition_fees': {'type': 'string', 'example': '$15,000 per year'},
                        'application_link': {'type': 'string', 'format': 'url', 'example': 'http://apply.techuniversity.edu/cs'}
                    }
                },
                'BaseUserRegistrationRequest': {
                    'type': 'object',
                    'required': ['email', 'password'],
                    'properties': {
                        'email': {'type': 'string', 'format': 'email', 'example': 'newuser@example.com'},
                        'password': {'type': 'string', 'format': 'password', 'minLength': 8, 'example': 'newpassword123'}
                    }
                },
                'UserRegistrationRequest': {
                    'allOf': [
                        {'$ref': '#/components/schemas/BaseUserRegistrationRequest'},
                        {
                            'type': 'object',
                            'required': ['phone', 'address', 'areas_of_interest', 'degree_level', 'mode'],
                            'properties': {
                                'phone': {'type': 'string', 'example': '123-456-7890'},
                                'address': {'type': 'string', 'example': '123 Main St, Anytown, USA'},
                                'areas_of_interest': {'type': 'array', 'items': {'type': 'string'}, 'example': ['AI', 'Web Development']},
                                'degree_level': {'type': 'string', 'enum': ['Bachelors', 'Masters', 'PhD', 'Diploma', 'Certificate'], 'example': 'Bachelors'},
                                'mode': {'type': 'string', 'enum': ['Online', 'On-Campus', 'Hybrid'], 'example': 'Online'}
                            }
                        }
                    ]
                },
                'ConsultantRegistrationRequest': {
                    'allOf': [
                        {'$ref': '#/components/schemas/BaseUserRegistrationRequest'},
                        {
                            'type': 'object',
                            'required': ['phone', 'address', 'shift', 'presence'],
                            'properties': {
                                'phone': {'type': 'string', 'example': '987-654-3210'},
                                'address': {'type': 'string', 'example': '456 Oak Ave, Anytown, USA'},
                                'shift': {'type': 'string', 'enum': ['Morning', 'Evening', 'Night'], 'example': 'Morning'},
                                'presence': {'type': 'string', 'enum': ['Online', 'Offline'], 'example': 'Online'},
                                'employment_type': {'type': 'string', 'enum': ['part-time', 'full-time'], 'example': 'part-time', 'description': 'Employment type affects available time slots. Part-time: 3 slots per day (morning). Full-time: 6 slots per day (morning and afternoon).'}
                            }
                        }
                    ]
                },
                'AdminRegistrationRequest': { # Essentially the same as BaseUserRegistrationRequest
                    'allOf': [
                        {'$ref': '#/components/schemas/BaseUserRegistrationRequest'}
                    ]
                },
                'BaseRegistrationSuccessResponse': {
                    'type': 'object',
                    'properties': {
                        'message': {'type': 'string', 'example': 'user registered successfully'},
                        'user_id': {'type': 'integer', 'example': 1}
                    }
                },
                'UserRegistrationSuccessResponse': {
                    'allOf': [
                        {'$ref': '#/components/schemas/BaseRegistrationSuccessResponse'},
                        {
                            'type': 'object',
                            'properties': {
                                'recommendations': {
                                    'type': 'array',
                                    'items': {'$ref': '#/components/schemas/ProgramRecommendation'}
                                },
                                'recommendation_count': {'type': 'integer', 'example': 3}
                            }
                        }
                    ]
                },
                'BookingResponse': {
                    'type': 'object',
                    'properties': {
                        'booking_id': {'type': 'integer', 'example': 1},
                        'consultant_name': {'type': 'string', 'example': 'consultant@example.com'},
                        'date': {'type': 'string', 'format': 'date', 'example': '2025-06-25'},
                        'time': {'type': 'string', 'example': '09:00 - 10:00'},
                        'status': {'type': 'string', 'enum': ['Pending', 'Confirmed', 'Cancelled'], 'example': 'Pending'}
                    }
                },
                'TimeSlotResponse': {
                    'type': 'object',
                    'properties': {
                        'slot_id': {'type': 'integer', 'example': 1},
                        'date': {'type': 'string', 'format': 'date', 'example': '2025-06-25'},
                        'start_time': {'type': 'string', 'example': '09:00'},
                        'end_time': {'type': 'string', 'example': '10:00'},
                        'is_available': {'type': 'boolean', 'example': True}
                    }
                }
            }
        },
        # If you want to protect all endpoints by default:
        # 'security': [{'BearerAuth': []}]
    }
    swagger = Swagger(app) # Initialize Flasgger with the app

    # Import and register blueprints
    from .routes.auth import auth_bp
    # Ensure the import path and blueprint name are correct
    from .routes.recommendation import recommendations_bp 
    from .routes.consultation import consultation_bp 
    from .routes.booking import booking_bp
    from .routes.admin import booking_bp as admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(consultation_bp, url_prefix='/api/consultation')
    app.register_blueprint(booking_bp, url_prefix='/api/booking')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Add a custom route handler for CORS preflight requests
    @app.route('/api/consultant/stats', methods=['OPTIONS'])
    def handle_options_consultant_stats():
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
        return response

    # Add CORS headers to all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
        return response

    return app