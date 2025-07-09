from app.models import Program, University
from app.extensions import db
from sqlalchemy import func

def get_recommendations(areas_of_interest=None, degree_level=None, mode=None, limit=10):
    """
    Get program recommendations based on user preferences.
    
    Args:
        areas_of_interest (str|list): Areas of interest as comma-separated string or list
        degree_level (str): Preferred degree level (bachelor, master, etc.)
        mode (str): Preferred mode of study (online, on-campus, hybrid)
        limit (int): Maximum number of recommendations to return
        Bussiness  Logic   
    Returns:
        list: Recommended programs with university information
    """
    # Process areas of interest
    if not areas_of_interest:
        areas_list = []
    elif isinstance(areas_of_interest, str):
        areas_list = [area.strip().lower() for area in areas_of_interest.split(',') if area.strip()]
    else:
        areas_list = [area.strip().lower() for area in areas_of_interest if area.strip()]
    
    # Build the base query
    query = Program.query
    
    # Apply filters
    filters_applied = False
    
    if areas_list:
        area_filters = [func.lower(Program.area_of_study).like(f"%{area}%") for area in areas_list]
        query = query.filter(db.or_(*area_filters))
        filters_applied = True
    
    if degree_level:
        query = query.filter(func.lower(Program.degree_level) == degree_level.lower())
        filters_applied = True
    
    if mode:
        query = query.filter(func.lower(Program.mode) == mode.lower())
        filters_applied = True
    
    # Get programs with limit
    programs = query.limit(limit).all()
    
    # Fallback if no results with strict filters
    if not programs and filters_applied and areas_list:
        # Try just matching by areas of interest
        query = Program.query
        area_filters = [func.lower(Program.area_of_study).like(f"%{area}%") for area in areas_list]
        query = query.filter(db.or_(*area_filters))
        programs = query.limit(limit).all()
    
    # If still no results, return default programs
    if not programs:
        programs = Program.query.limit(limit).all()
    
    # Efficiently retrieve university information in a single query
    if programs:
        uni_ids = {p.uni_id for p in programs if p.uni_id}
        universities = {u.uni_id: u for u in University.query.filter(University.uni_id.in_(uni_ids)).all()} if uni_ids else {}
    else:
        universities = {}
    
    # Format recommendations
    results = [
        {
            'program_id': program.program_id,
            'program_name': program.name,
            'degree_level': program.degree_level,
            'mode': program.mode,
            'duration': program.duration,
            'fee': program.fee,
            'area_of_study': program.area_of_study,
            'requirements': program.requirements,
            'university_id': program.uni_id,
            'university_name': universities.get(program.uni_id, {}).name if program.uni_id in universities else "Unknown"
        }
        for program in programs
    ]
    
    return results