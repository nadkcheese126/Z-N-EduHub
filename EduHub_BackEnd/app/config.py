class Config:
    SECRET_KEY = 'supersecret'
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123Batma$@localhost/edu_consultancy'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc0OTc0MzMyOSwiaWF0IjoxNzQ5NzQzMzI5fQ.N8jmdD0kTVe3_6ejP2mHKRUHjDvWe6InyrWG_-woysA'  # Change this in your production environment!
    JWT_TOKEN_LOCATION = ['cookies', 'headers'] # Allow both cookies and headers
    JWT_COOKIE_SECURE = False # Set to True in production over HTTPS
    JWT_COOKIE_SAMESITE = None # Disable SameSite to allow cross-site cookie usage
    JWT_COOKIE_HTTPONLY = False # Make access token cookie inaccessible to JavaScript
    JWT_COOKIE_CSRF_PROTECT = False # Disable CSRF protection for cookies for now