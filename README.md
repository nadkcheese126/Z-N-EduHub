# Online Education Consultancy System
## Installation
### Clone project
~~~
git clone https://github.com/nadkcheese126/Z-N-EduHub.git
~~~
### Create local environment
~~~
python3 -m venv venv
source .\venv\Scripts\Activate  
~~~
### Installing dependencies
~~~
pip install Flask Flask-SQLAlchemy flask-mysql-connector
~~~
### Creation of database run below code
~~~
python3
from app import create_app
from app.extensions import db
from app.models import *

app = create_app()
app.app_context().push()
db.create_all()
~~~
