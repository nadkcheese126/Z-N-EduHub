from flask import Blueprint, jsonify, request
from app.models import Program, University, Consultant
from app.extensions import db
from sqlalchemy import func
from flask_jwt_extended import jwt_required

consultation_bp = Blueprint('consultation', __name__)

@consultation_bp.route('/getConsultantDetails', methods=['GET'])
@jwt_required()
def get_consultant_details():
    try:
        consultants = Consultant.query.all()
        consultant_list = []
        for consultant in consultants:
            consultant_list.append({
                'id': consultant.id,
                'name': consultant.name,
                'email': consultant.email,
                'phone': consultant.phone,
                'address': consultant.address,
                'shift': consultant.shift,
                'presence': consultant.presence
            })
        
        return jsonify({'consultants': consultant_list}), 200
    except Exception as e:
        return jsonify({'error': 'An error occurred while fetching consultant details'}), 500
