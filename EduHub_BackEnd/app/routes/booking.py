from flask import Blueprint, jsonify, request
from app.models import Program, University, Consultant, Booking, ConsultantTimeSlot, User
from app.extensions import db
from sqlalchemy import func
from flask_jwt_extended import get_jwt, jwt_required, get_jwt_identity
from flasgger import swag_from
from datetime import datetime, date, timedelta
from app.utils.time_slot_generator import generate_consultant_time_slots
import random
import string

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/consultants/<int:consultant_id>/timeslots', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Get available time slots for a consultant',
    'description': 'Returns all available time slots for a specific consultant. Requires JWT authentication.',
    'security': [{'BearerAuth': []}],
    'parameters': [
        {
            'name': 'consultant_id',
            'in': 'path',
            'required': True,
            'schema': {
                'type': 'integer'
            },
            'description': 'ID of the consultant'
        },
        {
            'name': 'date',
            'in': 'query',
            'required': False,
            'schema': {
                'type': 'string',
                'format': 'date'
            },
            'description': 'Filter time slots by date (YYYY-MM-DD)'
        }
    ],
    'responses': {
        '200': {
            'description': 'List of available time slots',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'available_slots': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'slot_id': {'type': 'integer'},
                                        'date': {'type': 'string', 'format': 'date'},
                                        'start_time': {'type': 'string'},
                                        'end_time': {'type': 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '404': {
            'description': 'Consultant not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def get_consultant_timeslots(consultant_id):
    # Check if consultant exists
    consultant = Consultant.query.get(consultant_id)
    if not consultant:
        return jsonify({'error': 'Consultant not found'}), 404
    
    # Get date filter from query params if provided
    date_filter = request.args.get('date')
    
    # Query available time slots
    query = ConsultantTimeSlot.query.filter_by(
        consultant_id=consultant_id,
        is_available=True
    )
    
    # Apply date filter if provided
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Get available slots
    available_slots = query.all()
    
    # Format response
    timeslots = []
    for slot in available_slots:
        timeslots.append({
            'id': slot.slot_id,
            'date': slot.date.strftime('%Y-%m-%d'),
            'start_time': slot.start_time,
            'end_time': slot.end_time
        })
    
    return jsonify({'timeslots': timeslots})

@booking_bp.route('/consultants/timeslots/generate', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Generate time slots for consultants',
    'description': 'Generates time slots for consultants based on their employment type. Requires admin authentication.',
    'security': [{'BearerAuth': []}],
    'requestBody': {
        'description': 'Time slot generation parameters',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'consultant_id': {
                            'type': 'integer',
                            'description': 'ID of the consultant to generate slots for. If not provided, generates for all consultants.',
                            'required': False,
                            'example': 1
                        },
                        'num_weeks': {
                            'type': 'integer',
                            'description': 'Number of weeks to generate slots for',
                            'required': False,
                            'example': 4
                        },
                        'start_date': {
                            'type': 'string',
                            'format': 'date',
                            'description': 'Start date for generating slots (YYYY-MM-DD). If not provided, uses current date.',
                            'required': False,
                            'example': '2025-07-01'
                        }
                    }
                }
            }
        }
    },
    'responses': {
        '200': {
            'description': 'Time slots generated successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'},
                            'slots_created': {'type': 'integer'}
                        }
                    }
                }
            }
        },
        '401': {
            'description': 'Unauthorized - Not authenticated or not an admin',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def generate_time_slots():
    # Get request data
    data = request.get_json() or {}
    
    # Extract parameters
    consultant_id = data.get('consultant_id')
    num_weeks = data.get('num_weeks', 4)  # Default to 4 weeks
    
    # Parse start date if provided
    start_date = None
    if 'start_date' in data:
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Generate time slots
    slots_created = generate_consultant_time_slots(
        consultant_id=consultant_id,
        num_weeks=num_weeks,
        start_date=start_date
    )
    
    return jsonify({
        'message': 'Time slots generated successfully',
        'slots_created': slots_created
    })

@booking_bp.route('/createBooking', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Create a booking for a consultation',
    'description': 'Allows authenticated users to book a consultation with a consultant for a specific time slot. Requires JWT authentication.',
    'security': [{'BearerAuth': []}],
    'requestBody': {
        'description': 'Booking details',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'time_slot_id': {
                            'type': 'integer',
                            'description': 'ID of the time slot to book',
                            'example': 1
                        }
                    },
                    'required': ['time_slot_id']
                }
            }
        }
    },
    'responses': {
        '201': {
            'description': 'Booking created successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'},
                            'booking_id': {'type': 'integer'},
                            'consultant_name': {'type': 'string'},
                            'date': {'type': 'string', 'format': 'date'},
                            'time': {'type': 'string'}
                        }
                    }
                }
            }
        },
        '400': {
            'description': 'Bad request - Invalid input or time slot not available',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        '404': {
            'description': 'Time slot not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def create_booking():
    # Get current user from JWT token
    current_user_id = get_jwt_identity()
    
    # Check if the user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if 'time_slot_id' not in data:
        return jsonify({'error': 'Missing required field: time_slot_id'}), 400
    
    time_slot_id = data['time_slot_id']
    
    # Check if time slot exists and is available
    time_slot = ConsultantTimeSlot.query.get(time_slot_id)
    if not time_slot:
        return jsonify({'error': 'Time slot not found'}), 404
    
    if not time_slot.is_available:
        return jsonify({'error': 'This time slot is no longer available'}), 400
    
    # Create new booking
    new_booking = Booking(
        user_id=user.id,
        consultant_id=time_slot.consultant_id,
        time_slot_id=time_slot.slot_id,
        status='Pending'
    )
    
    # Mark time slot as unavailable
    time_slot.is_available = False
    
    # Save to database
    db.session.add(new_booking)
    db.session.commit()
    
    # Get consultant name for response
    consultant = Consultant.query.get(time_slot.consultant_id)
    
    return jsonify({
        'message': 'Booking created successfully',
        'booking_id': new_booking.booking_id,
        'consultant_name': f"{consultant.name if hasattr(consultant, 'name') and consultant.name else consultant.email}",
        'date': time_slot.date.strftime('%Y-%m-%d'),
        'time': f"{time_slot.start_time} - {time_slot.end_time}",
        'status': 'Pending',
        'requires_payment': True,
        'amount': getattr(consultant, 'hourly_rate', None) or 5000
    }), 201

@booking_bp.route('/bookings', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Get user bookings',
    'description': 'Returns all bookings for the authenticated user. Requires JWT authentication.',
    'security': [{'BearerAuth': []}],
    'responses': {
        '200': {
            'description': 'List of user bookings',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'bookings': {
                                'type': 'array',
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'booking_id': {'type': 'integer'},
                                        'consultant_email': {'type': 'string'},
                                        'date': {'type': 'string', 'format': 'date'},
                                        'time': {'type': 'string'},
                                        'status': {'type': 'string'}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})
def get_user_bookings():
    # Get current user from JWT token
    current_user_id = get_jwt_identity()
    
    # Query bookings for the user
    user_bookings = Booking.query.filter_by(user_id=current_user_id).all()
    
    # Format response
    bookings = []
    for booking in user_bookings:
        time_slot = ConsultantTimeSlot.query.get(booking.time_slot_id)
        consultant = Consultant.query.get(booking.consultant_id)
        
        bookings.append({
            'booking_id': booking.booking_id,
            'consultant_email': consultant.email,
            'date': time_slot.date.strftime('%Y-%m-%d'),
            'time': f"{time_slot.start_time} - {time_slot.end_time}",
            'status': booking.status
        })
    
    return jsonify({'bookings': bookings})

@booking_bp.route('/bookings/<int:booking_id>/cancel', methods=['PUT'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Cancel a booking',
    'description': 'Allows users to cancel their booking. Requires JWT authentication.',
    'security': [{'BearerAuth': []}],
    'parameters': [
        {
            'name': 'booking_id',
            'in': 'path',
            'required': True,
            'schema': {
                'type': 'integer'
            },
            'description': 'ID of the booking to cancel'
        }
    ],
    'responses': {
        '200': {
            'description': 'Booking cancelled successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'}
                        }
                    }
                }
            }
        },
        '403': {
            'description': 'Forbidden - Not authorized to cancel this booking',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        '404': {
            'description': 'Booking not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def cancel_booking(booking_id):
    # Get current user from JWT token
    current_user_id = get_jwt_identity()
    
    # Get the booking
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if the user owns this booking
    if str(booking.user_id) != current_user_id:
        return jsonify({'error': 'You are not authorized to cancel this booking'}), 403
    
    # Update booking status
    booking.status = 'Cancelled'
    
    # Make the time slot available again
    time_slot = ConsultantTimeSlot.query.get(booking.time_slot_id)
    if time_slot:
        time_slot.is_available = True
    
    # Save changes
    db.session.commit()
    
    return jsonify({'message': 'Booking cancelled successfully'})

@booking_bp.route('/consultants/<int:consultant_id>/employment-type', methods=['PUT'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Update consultant employment type',
    'description': 'Update a consultant\'s employment type (part-time or full-time). Requires admin authentication.',
    'security': [{'BearerAuth': []}],
    'parameters': [
        {
            'name': 'consultant_id',
            'in': 'path',
            'required': True,
            'schema': {
                'type': 'integer'
            },
            'description': 'ID of the consultant'
        }
    ],
    'requestBody': {
        'description': 'Employment type details',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'employment_type': {
                            'type': 'string',
                            'enum': ['part-time', 'full-time'],
                            'description': 'The employment type of the consultant',
                            'example': 'full-time'
                        }
                    },
                    'required': ['employment_type']
                }
            }
        }
    },
    'responses': {
        '200': {
            'description': 'Employment type updated successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'},
                            'consultant_id': {'type': 'integer'},
                            'employment_type': {'type': 'string'}
                        }
                    }
                }
            }
        },
        '400': {
            'description': 'Bad request - Invalid employment type',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        '404': {
            'description': 'Consultant not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def update_employment_type(consultant_id):
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if 'employment_type' not in data:
        return jsonify({'error': 'Missing required field: employment_type'}), 400
    
    employment_type = data['employment_type']
    
    # Validate employment type
    if employment_type not in ['part-time', 'full-time']:
        return jsonify({'error': 'Invalid employment type. Must be "part-time" or "full-time"'}), 400
    
    # Find consultant
    consultant = Consultant.query.get(consultant_id)
    if not consultant:
        return jsonify({'error': 'Consultant not found'}), 404
    
    # Update employment type
    consultant.employment_type = employment_type
    db.session.commit()
    
    return jsonify({
        'message': 'Employment type updated successfully',
        'consultant_id': consultant.id,
        'employment_type': consultant.employment_type
    })

@booking_bp.route('/consultants/<int:consultant_id>/regenerate-schedule', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Booking'],
    'summary': 'Regenerate schedule for a specific consultant',
    'description': 'Regenerates the time slots for a specific consultant based on their presence (Online/Offline). Requires JWT authentication and admin privileges.',
    'security': [{'BearerAuth': []}],
    'parameters': [
        {
            'name': 'consultant_id',
            'in': 'path',
            'required': True,
            'schema': {
                'type': 'integer'
            },
            'description': 'ID of the consultant'
        }
    ],
    'responses': {
        '200': {
            'description': 'Schedule regenerated successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'},
                            'slots_created': {'type': 'integer'}
                        }
                    }
                }
            }
        },
        '404': {
            'description': 'Consultant not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def regenerate_consultant_schedule(consultant_id):
    # Check if consultant exists
    consultant = Consultant.query.get(consultant_id)
    if not consultant:
        return jsonify({'error': 'Consultant not found'}), 404
    
    # Clear future time slots for this consultant
    future_slots = ConsultantTimeSlot.query.filter(
        ConsultantTimeSlot.consultant_id == consultant_id,
        ConsultantTimeSlot.date >= date.today()
    ).all()
    
    # Delete slots that don't have bookings
    slots_deleted = 0
    for slot in future_slots:
        # Check if this slot has a booking
        booking = Booking.query.filter_by(time_slot_id=slot.slot_id).first()
        if not booking:
            db.session.delete(slot)
            slots_deleted += 1
    
    db.session.commit()
    
    # Generate new time slots for this consultant
    slots_created = generate_consultant_time_slots(
        consultant_id=consultant_id,
        num_weeks=4  # Generate for 4 weeks
    )
    
    return jsonify({
        'message': f'Schedule regenerated successfully. Deleted {slots_deleted} unused slots and created {slots_created} new slots.',
        'slots_deleted': slots_deleted,
        'slots_created': slots_created
    })
@booking_bp.route('/consultants/<int:consultant_id>/getBookings', methods=['GET'])
@jwt_required()
def get_consultant_bookings(consultant_id):
    """
    Get all bookings for a specific consultant.
    
    This endpoint retrieves all bookings made for a specific consultant.
    Requires JWT authentication.
    
    Parameters:
        consultant_id (int): ID of the consultant to get bookings for.
    
    Returns:
        JSON response with a list of bookings.
    """
    current_user_id = get_jwt_identity()
    claims = get_jwt()  # Get all JWT claims
    
    # Check if the user is an admin or the consultant themselves
    is_admin = claims.get('user_type') == 'admin'
    if not current_user_id or (not is_admin and int(current_user_id) != consultant_id):
        return jsonify({'error': 'Unauthorized access'}), 403
    
    bookings = Booking.query.filter_by(consultant_id=consultant_id).all()
    users = User.query.all()
    booking_list = []
    for booking in bookings:
        time_slot = ConsultantTimeSlot.query.get(booking.time_slot_id)
        user = next((u for u in users if u.id == booking.user_id), None)
        booking_list.append({
            'booking_id': booking.booking_id,
            'user_id': booking.user_id,
            'user_name': user.name if user else "Unknown",
            'user_email': user.email if user else "Unknown",
            'user_phone': user.phone if user else "Unknown",
            'date': time_slot.date.strftime('%Y-%m-%d'),
            'start_time': time_slot.start_time,
            'end_time': time_slot.end_time,
            'status': booking.status
        })

    return jsonify({'bookings': booking_list}), 200

def confirm_payment(booking_id):
    """
    This function is a placeholder for payment confirmation logic.
    In a real application, this would interact with a payment gateway.
    """

    booking = Booking.query.filter_by(booking_id=booking_id).first()

    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    booking.status = 'Confirmed'
    db.session.commit()
    # For now, we just return a success message
    return jsonify({'message': 'Payment confirmed successfully'}), 200

@booking_bp.route('/payment/process', methods=['POST'])
@jwt_required()
@swag_from({
    'tags': ['Payment'],
    'summary': 'Process payment for a booking',
    'description': 'Process payment with fake card details for a booking. This is a dummy payment system.',
    'security': [{'BearerAuth': []}],
    'requestBody': {
        'description': 'Payment details',
        'required': True,
        'content': {
            'application/json': {
                'schema': {
                    'type': 'object',
                    'properties': {
                        'booking_id': {
                            'type': 'integer',
                            'description': 'ID of the booking to pay for',
                            'example': 1
                        },
                        'card_number': {
                            'type': 'string',
                            'description': 'Credit card number (fake)',
                            'example': '4111111111111111'
                        },
                        'expiry_month': {
                            'type': 'string',
                            'description': 'Card expiry month',
                            'example': '12'
                        },
                        'expiry_year': {
                            'type': 'string',
                            'description': 'Card expiry year',
                            'example': '2025'
                        },
                        'cvv': {
                            'type': 'string',
                            'description': 'Card CVV',
                            'example': '123'
                        },
                        'cardholder_name': {
                            'type': 'string',
                            'description': 'Name on card',
                            'example': 'John Doe'
                        }
                    },
                    'required': ['booking_id', 'card_number', 'expiry_month', 'expiry_year', 'cvv', 'cardholder_name']
                }
            }
        }
    },
    'responses': {
        '200': {
            'description': 'Payment processed successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'message': {'type': 'string'},
                            'transaction_id': {'type': 'string'},
                            'amount': {'type': 'number'},
                            'status': {'type': 'string'}
                        }
                    }
                }
            }
        },
        '400': {
            'description': 'Bad request - Invalid payment details',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        },
        '404': {
            'description': 'Booking not found',
            'content': {
                'application/json': {
                    'schema': {
                        '$ref': '#/components/schemas/ErrorResponse'
                    }
                }
            }
        }
    }
})
def process_payment():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['booking_id', 'card_number', 'expiry_month', 'expiry_year', 'cvv', 'cardholder_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    booking_id = data['booking_id']
    card_number = data['card_number']
    expiry_month = data['expiry_month']
    expiry_year = data['expiry_year']
    cvv = data['cvv']
    cardholder_name = data['cardholder_name']
    
    # Get the booking
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if user owns this booking
    if str(booking.user_id) != current_user_id:
        return jsonify({'error': 'You are not authorized to pay for this booking'}), 403
    
    # Check if booking is in pending status
    if booking.status != 'Pending':
        return jsonify({'error': 'This booking is not pending payment'}), 400
    
    # Dummy payment validation
    # Simulate payment failures for specific card numbers
    if card_number == '4000000000000002':
        return jsonify({'error': 'Payment declined - Insufficient funds'}), 400
    elif card_number == '4000000000000119':
        return jsonify({'error': 'Payment declined - Invalid card'}), 400
    elif len(card_number) < 13 or len(card_number) > 19:
        return jsonify({'error': 'Invalid card number length'}), 400
    elif len(cvv) != 3:
        return jsonify({'error': 'Invalid CVV'}), 400
    
    # Get consultant hourly rate for amount calculation
    consultant = Consultant.query.get(booking.consultant_id)
    amount = getattr(consultant, 'hourly_rate', None) or 5000  # Default LKR 5000
    
    # Generate fake transaction ID
    transaction_id = 'TXN' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    
    # Update booking status to Confirmed
    booking.status = 'Confirmed'
    db.session.commit()
    
    return jsonify({
        'message': 'Payment processed successfully',
        'transaction_id': transaction_id,
        'amount': amount,
        'status': 'Confirmed'
    }), 200

@booking_bp.route('/bookings/<int:booking_id>/payment-status', methods=['GET'])
@jwt_required()
@swag_from({
    'tags': ['Payment'],
    'summary': 'Get payment status for a booking',
    'description': 'Get the current payment/booking status',
    'security': [{'BearerAuth': []}],
    'parameters': [
        {
            'name': 'booking_id',
            'in': 'path',
            'required': True,
            'schema': {
                'type': 'integer'
            },
            'description': 'ID of the booking'
        }
    ],
    'responses': {
        '200': {
            'description': 'Payment status retrieved successfully',
            'content': {
                'application/json': {
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'booking_id': {'type': 'integer'},
                            'status': {'type': 'string'},
                            'requires_payment': {'type': 'boolean'}
                        }
                    }
                }
            }
        }
    }
})
def get_payment_status(booking_id):
    current_user_id = get_jwt_identity()
    
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if user owns this booking
    if str(booking.user_id) != current_user_id:
        return jsonify({'error': 'You are not authorized to view this booking'}), 403
    
    return jsonify({
        'booking_id': booking.booking_id,
        'status': booking.status,
        'requires_payment': booking.status == 'Pending'
    }), 200