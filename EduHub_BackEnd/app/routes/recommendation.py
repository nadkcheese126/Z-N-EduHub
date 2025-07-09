from flask import Blueprint, jsonify, request
from flasgger import swag_from
from app.utils.recommendation_helper import get_recommendations
from flask_jwt_extended import jwt_required, get_jwt_identity

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/explore', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Recommendations'],
    'summary': 'Explore program recommendations based on criteria (Protected).',
    'description': 'Allows authenticated users to get program recommendations by specifying areas of interest, degree level, and mode of study. Requires JWT authentication via cookie.',
    'security': [{'BearerAuth': []}],
    'requestBody': {
        'description': 'Criteria for program recommendations.',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'areas_of_interest': {
                            'type': 'array',
                            'items': {'type': 'string'},
                            'description': 'List of areas of interest.',
                            'example': ['Artificial Intelligence', 'Software Engineering']
                        },
                        'degree_level': {
                            'type': 'string',
                            'description': 'Desired degree level.',
                            'enum': ['Bachelors', 'Masters', 'PhD', 'Diploma', 'Certificate'],
                            'example': 'Masters'
                        },
                        'mode': {
                            'type': 'string',
                            'description': 'Preferred mode of study.',
                            'enum': ['Online', 'On-Campus', 'Hybrid'],
                            'example': 'Online'
                        },
                        'limit': {
                            'type': 'integer',
                            'description': 'Maximum number of recommendations to return.',
                            'default': 10,
                            'example': 5
                        }
                    },
                    'required': ['areas_of_interest', 'degree_level', 'mode']
                }
            }
        }
    },
    'responses': {
        '200': {
            'description': 'A list of program recommendations based on the provided criteria.',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'count': {'type': 'integer', 'example': 2},
                            'criteria': {
                                'type': 'object',
                                'properties': {
                                    'areas_of_interest': {'type': 'array', 'items': {'type': 'string'}, 'example': ['AI']},
                                    'degree_level': {'type': 'string', 'example': 'Masters'},
                                    'mode': {'type': 'string', 'example': 'Online'}
                                }
                            },
                            'recommendations': {
                                'type': 'array',
                                'items': {'$ref': '#/components/schemas/ProgramRecommendation'}
                            },
                            'user_info': {
                                'type': 'object',
                                'properties': {
                                    'id': {'type': 'integer'},
                                    'type': {'type': 'string'}
                                },
                                'description': 'Identity of the logged-in user.'
                            }
                        }
                    }
                }
            }
        },
        '400': {
            'description': 'Bad Request - Invalid or missing input data.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        },
        '401': {
            'description': 'Unauthorized - Missing or invalid token.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        },
        '500': {
            'description': 'Internal Server Error - An error occurred while processing the request.',
            'content': {
                'application/json': {
                    'schema': {'$ref': '#/components/schemas/ErrorResponse'}
                }
            }
        }
    }
})
def explore_recommendations():
    """
    Get program recommendations based on provided criteria without affecting user profile.
    
    Expected JSON body:
    {
        "areas_of_interest": "Computer Science, Data Science",
        "degree_level": "master",
        "mode": "online"
    }
    """
    current_user = get_jwt_identity()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        areas_of_interest = data.get('areas_of_interest', []) # Default to empty list
        degree_level = data.get('degree_level', '')
        mode = data.get('mode', '')
        limit = data.get('limit', 10)
        try:
            limit = int(limit)
            if limit < 1:
                limit = 10
        except (ValueError, TypeError):
            limit = 10
        
        recommendations = get_recommendations(
            areas_of_interest=areas_of_interest,
            degree_level=degree_level,
            mode=mode,
            limit=limit
        )
        
        return jsonify({
            'count': len(recommendations),
            'criteria': {
                'areas_of_interest': areas_of_interest,
                'degree_level': degree_level,
                'mode': mode
            },
            'recommendations': recommendations,
            'user_info': current_user
        })
        
    except Exception as e:
        print(f"Error in explore_recommendations: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500