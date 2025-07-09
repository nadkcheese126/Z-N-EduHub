from flask import Blueprint, jsonify, request
from app.models import Program, University, Consultant, Booking, ConsultantTimeSlot, User, Admin
from app.extensions import db
from sqlalchemy import func
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app.utils.time_slot_generator import generate_consultant_time_slots

booking_bp = Blueprint('admin', __name__)

def check_admin_access():
    user_id = get_jwt_identity()
    if not user_id:
        return False
    
    admin_user = Admin.query.filter_by(id=user_id).first()
    return admin_user is not None

@booking_bp.route('/getBookings', methods=['GET'])
@jwt_required()
def get_bookings():
    if not check_admin_access():
        return jsonify({"message": "Unauthorized access"}), 403
    
    try:
        bookings = Booking.query.all()
        booking_list = []
        
        for booking in bookings:
            user = User.query.get(booking.user_id)
            consultant = Consultant.query.get(booking.consultant_id)
            time_slot = ConsultantTimeSlot.query.get(booking.time_slot_id)
            
            booking_data = {
                'id': booking.booking_id,
                'user_id': booking.user_id,
                'user_name': user.name if user else "Unknown",
                'consultant_id': booking.consultant_id,
                'consultant_name': consultant.name if consultant else "Unknown",
                'time_slot_id': booking.time_slot_id,
                'status': booking.status,
                'created_at': booking.booking_date.isoformat()
            }
            
            if time_slot:
                booking_data.update({
                    'date': time_slot.date.isoformat(),
                    'start_time': time_slot.start_time,
                    'end_time': time_slot.end_time
                })
            else:
                booking_data.update({
                    'date': None,
                    'start_time': None,
                    'end_time': None
                })
                
            booking_list.append(booking_data)
        
        return jsonify({"bookings": booking_list}), 200
        
    except Exception as e:
        print(f"Get bookings error: {e}")
        return jsonify({
            "bookings": [],
            "error": "Failed to fetch bookings"
        }), 500

@booking_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_analytics_overview():
    if not check_admin_access():
        return jsonify({"message": "Unauthorized access"}), 403
    
    # Get total counts
    total_users = User.query.count()
    total_consultants = Consultant.query.count()
    total_bookings = Booking.query.count()
    total_programs = Program.query.count()
    
    # Get bookings by status
    confirmed_bookings = Booking.query.filter_by(status='Confirmed').count()
    pending_bookings = Booking.query.filter_by(status='Pending').count()
    cancelled_bookings = Booking.query.filter_by(status='Cancelled').count()

    total_revenue = confirmed_bookings * 5000.0
    
    # Get recent activity (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    recent_bookings = Booking.query.filter(Booking.booking_date >= week_ago).count()
    recent_users = User.query.filter(User.created_at >= week_ago).count()
    
    return jsonify({
        "overview": {
            "total_users": total_users,
            "total_consultants": total_consultants,
            "total_bookings": total_bookings,
            "total_programs": total_programs,
            "confirmed_bookings": confirmed_bookings,
            "pending_bookings": pending_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_revenue": total_revenue,
            "recent_bookings": recent_bookings,
            "recent_users": recent_users
        }
    }), 200



@booking_bp.route('/analytics/consultants', methods=['GET'])
@jwt_required()
def get_consultant_analytics():
    if not check_admin_access():
        return jsonify({"message": "Unauthorized access"}), 403
    
    try:
        # Get top consultants by number of confirmed bookings
        top_consultants = db.session.query(
            Consultant.id,
            Consultant.name,
            Consultant.email,
            func.count(Booking.booking_id).label('total_bookings'),
            func.sum(func.case((Booking.status == 'Confirmed', 1), else_=0)).label('confirmed_bookings'),
            (func.sum(func.case((Booking.status == 'Confirmed', 1), else_=0)) * 5000.0).label('revenue_generated')
        ).outerjoin(Booking, Consultant.id == Booking.consultant_id).group_by(
            Consultant.id, Consultant.name, Consultant.email
        ).order_by(func.count(Booking.booking_id).desc()).all()
        
        # Get consultant utilization (booked vs available slots)
        consultant_utilization = []
        for consultant in Consultant.query.all():
            total_slots = ConsultantTimeSlot.query.filter_by(consultant_id=consultant.id).count()
            booked_slots = ConsultantTimeSlot.query.filter_by(
                consultant_id=consultant.id,
                is_available=False
            ).count()
            
            utilization_rate = (booked_slots / total_slots * 100) if total_slots > 0 else 0
            
            consultant_utilization.append({
                "consultant_id": consultant.id,
                "consultant_name": consultant.name,
                "total_slots": total_slots,
                "booked_slots": booked_slots,
                "utilization_rate": round(utilization_rate, 2)
            })
        
        top_consultants_data = [
            {
                "consultant_id": row.id,
                "consultant_name": row.name,
                "consultant_email": row.email,
                "total_bookings": row.total_bookings,
                "confirmed_bookings": row.confirmed_bookings,
                "revenue_generated": float(row.revenue_generated)
            } for row in top_consultants
        ]
        
        return jsonify({
            "consultant_analytics": {
                "top_consultants": top_consultants_data,
                "utilization": consultant_utilization
            }
        }), 200
        
    except Exception as e:
        # Return mock data if query fails
        print(f"Consultant analytics error: {e}")
        return jsonify({
            "Unable to fetch consultant analytics": str(e)
        }), 200

@booking_bp.route('/analytics/bookings', methods=['GET'])
@jwt_required()
def get_booking_analytics():
    if not check_admin_access():
        return jsonify({"message": "Unauthorized access"}), 403
    
    # Get booking trends for the last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    daily_bookings = db.session.query(
        func.date(Booking.booking_date).label('date'),
        func.count(Booking.booking_id).label('count')
    ).filter(
        Booking.booking_date >= thirty_days_ago
    ).group_by(func.date(Booking.booking_date)).all()
    
    # Get booking status distribution
    status_distribution = db.session.query(
        Booking.status,
        func.count(Booking.booking_id).label('count')
    ).group_by(Booking.status).all()
    
    # Get popular time slots
    popular_times = db.session.query(
        ConsultantTimeSlot.start_time,
        func.count(Booking.booking_id).label('booking_count')
    ).join(Booking, ConsultantTimeSlot.slot_id == Booking.time_slot_id).group_by(
        ConsultantTimeSlot.start_time
    ).order_by(func.count(Booking.booking_id).desc()).limit(10).all()
    
    daily_trends = [
        {
            "date": row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date),
            "count": row.count
        } for row in daily_bookings
    ]
    
    status_data = [
        {
            "status": row.status,
            "count": row.count
        } for row in status_distribution
    ]
    
    time_slots_data = [
        {
            "time": row.start_time,
            "booking_count": row.booking_count
        } for row in popular_times
    ]
    
    return jsonify({
        "booking_analytics": {
            "daily_trends": daily_trends,
            "status_distribution": status_data,
            "popular_time_slots": time_slots_data
        }
    }), 200

@booking_bp.route('/analytics/users', methods=['GET'])
@jwt_required()
def get_user_analytics():
    if not check_admin_access():
        return jsonify({"message": "Unauthorized access"}), 403
    
    # Get user registration trends for the last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    daily_registrations = db.session.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= thirty_days_ago
    ).group_by(func.date(User.created_at)).all()
    
    # Get user demographics
    degree_distribution = db.session.query(
        User.degree_level,
        func.count(User.id).label('count')
    ).filter(User.degree_level.isnot(None)).group_by(User.degree_level).all()
    
    mode_distribution = db.session.query(
        User.mode,
        func.count(User.id).label('count')
    ).filter(User.mode.isnot(None)).group_by(User.mode).all()
    
    # Get areas of interest (this might need parsing if stored as comma-separated)
    areas_query = db.session.query(User.areas_of_interest).filter(
        User.areas_of_interest.isnot(None)
    ).all()
    
    # Parse areas of interest
    areas_count = {}
    for row in areas_query:
        if row.areas_of_interest:
            areas = [area.strip() for area in row.areas_of_interest.split(',')]
            for area in areas:
                areas_count[area] = areas_count.get(area, 0) + 1
    
    registration_trends = [
        {
            "date": row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date),
            "count": row.count
        } for row in daily_registrations
    ]
    
    degree_data = [
        {
            "degree_level": row.degree_level,
            "count": row.count
        } for row in degree_distribution
    ]
    
    mode_data = [
        {
            "mode": row.mode,
            "count": row.count
        } for row in mode_distribution
    ]
    
    areas_data = [
        {
            "area": area,
            "count": count
        } for area, count in sorted(areas_count.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    return jsonify({
        "user_analytics": {
            "registration_trends": registration_trends,
            "degree_distribution": degree_data,
            "mode_distribution": mode_data,
            "popular_areas": areas_data
        }
    }), 200

