from datetime import datetime, timedelta, date
from app.models import Consultant, ConsultantTimeSlot
from app.extensions import db

def generate_consultant_time_slots(consultant_id=None, num_weeks=1, start_date=None):
    """
    Generate time slots for consultants based on their presence.
    
    Parameters:
    - consultant_id: If provided, generate slots only for this consultant. If None, generate for all consultants.
    - num_weeks: Number of weeks to generate slots for (default: 1 week)
    - start_date: Starting date for slot generation (default: today)
    
    Time slots logic:
    - Part-time consultants (Offline): 3 slots per day (9:00-10:00, 10:00-11:00, 11:00-12:00), Monday-Friday
    - Full-time consultants (Online): 6 slots per day (9:00-10:00, 10:00-11:00, 11:00-12:00, 15:00-16:00, 16:00-17:00, 17:00-18:00), Monday-Friday
    """
    if start_date is None:
        start_date = date.today()
    
    # Define time slots
    morning_slots = [
        ("09:00", "10:00"),
        ("10:00", "11:00"),
        ("11:00", "12:00")
    ]
    
    afternoon_slots = [
        ("15:00", "16:00"),
        ("16:00", "17:00"),
        ("17:00", "18:00")
    ]
    
    # Get consultants
    if consultant_id:
        consultants = Consultant.query.filter_by(id=consultant_id).all()
    else:
        consultants = Consultant.query.all()
    
    slots_created = 0
    
    for consultant in consultants:
        # Determine which slots to use based on presence
        # 'Online' = Full-time (morning + afternoon)
        # 'Offline' = Part-time (morning only)
        if consultant.presence == 'Online':
            daily_slots = morning_slots + afternoon_slots
        else:  # 'Offline' or any other value defaults to part-time
            daily_slots = morning_slots
        
        # Generate slots for the specified number of weeks
        current_date = start_date
        for _ in range(num_weeks * 5):  # 5 working days per week
            # Skip weekends
            if current_date.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
                current_date += timedelta(days=1)
                continue
            
            for start_time, end_time in daily_slots:
                # Check if this slot already exists & pevents duplicates
                existing_slot = ConsultantTimeSlot.query.filter_by(
                    consultant_id=consultant.id,
                    date=current_date,
                    start_time=start_time,
                    end_time=end_time
                ).first()
                
                # Only create if it doesn't exist
                if not existing_slot:
                    new_slot = ConsultantTimeSlot(
                        consultant_id=consultant.id,
                        date=current_date,
                        start_time=start_time,
                        end_time=end_time,
                        is_available=True
                    )
                    db.session.add(new_slot)
                    slots_created += 1
            
            current_date += timedelta(days=1)
    
    db.session.commit()
    return slots_created
