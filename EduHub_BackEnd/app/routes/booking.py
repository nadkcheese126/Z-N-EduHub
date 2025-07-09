from flask import Blueprint, jsonify, request
from app.models import Program, University, Consultant, Booking, ConsultantTimeSlot, User
from app.extensions import db
from sqlalchemy import func
from flask_jwt_extended import get_jwt, jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app.utils.time_slot_generator import generate_consultant_time_slots
import random
import string

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/consultants/<int:consultant_id>/timeslots', methods=['GET'])
@jwt_required()
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


@booking_bp.route('/createBooking', methods=['POST'])
@jwt_required()
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








@booking_bp.route('/consultants/<int:consultant_id>/getBookings', methods=['GET'])
@jwt_required()
def get_consultant_bookings(consultant_id):
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
    
    booking = Booking.query.filter_by(booking_id=booking_id).first()

    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    booking.status = 'Confirmed'
    db.session.commit()
    # For now, we just return a success message
    return jsonify({'message': 'Payment confirmed successfully'}), 200

@booking_bp.route('/payment/process', methods=['POST'])
@jwt_required()
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

@booking_bp.route('/<int:booking_id>/status', methods=['PATCH'])
@jwt_required()
def update_booking_status(booking_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    data = request.get_json()

    # Validate request data
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400

    new_status = data['status']
    if new_status not in ['Confirmed', 'Cancelled', 'Pending']:
        return jsonify({'error': 'Invalid status. Must be Confirmed, Cancelled, or Pending'}), 400

    # Get the booking
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    # Check authorization - only the consultant for this booking can update status
    is_consultant = claims.get('user_type') == 'consultant'
    if not is_consultant or int(current_user_id) != booking.consultant_id:
        return jsonify({'error': 'Unauthorized to update this booking'}), 403

    # Update booking status
    booking.status = new_status
    db.session.commit()

    return jsonify({
        'message': 'Booking status updated successfully',
        'booking_id': booking.booking_id,
        'status': booking.status
    }), 200

