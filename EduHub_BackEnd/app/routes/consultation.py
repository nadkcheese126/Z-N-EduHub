from flask import Blueprint, jsonify, request
from app.models import Program, University, Consultant
from app.extensions import db
from sqlalchemy import func
from flask_jwt_extended import jwt_required
from flasgger import swag_from

consultation_bp = Blueprint('consultation', __name__)

@consultation_bp.route('/getConsultantDetails', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Consultation'],
    'summary': 'Get details of all consultants (Protected).',
    'description': 'Retrieves a list of all consultants. Requires JWT authentication.',
    'security': [{'BearerAuth': []}],
    'responses': {
        '200': {
            'description': 'A list of consultants.',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'consultants': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'id': {'type': 'integer'},
                                        'name': {'type': 'string'},
                                        'email': {'type': 'string', 'format': 'email'},
                                        'phone': {'type': 'string'},
                                        'address': {'type': 'string'},
                                        'shift': {'type': 'string'},
                                        'presence': {'type': 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '401': {
            'description': 'Unauthorized - Missing or invalid JWT token.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        },
        '500': {
            'description': 'Internal Server Error.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        }
    }
})
def get_consultant_details():
    """
    Get details of all consultants.
    
    Returns:
        JSON: List of consultants with their details.
    """
    try:
        consultants = db.session.query(Consultant).all()
        consultant_details = []
        
        for consultant in consultants:
            details = {
                'id': consultant.id,
                'name': consultant.name,
                'email': consultant.email,
                'phone': consultant.phone,
                'address': consultant.address,
                'shift': consultant.shift,
                'presence': consultant.presence
            }
            consultant_details.append(details)
        
        return jsonify({'consultants': consultant_details}), 200
    
    except Exception as e:
        print(f"Error in get_consultant_details: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching consultant details'}), 500