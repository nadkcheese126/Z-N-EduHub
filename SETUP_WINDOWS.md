
# EduHub - Windows Setup Guide

This guide will help you set up and run the EduHub educational consultancy platform on a Windows PC.

## Prerequisites

Before starting, ensure you have the following installed on your Windows system:

### 1. Git
- Download and install Git from [https://git-scm.com/download/win](https://git-scm.com/download/win)
- During installation, select "Git from the command line and also from 3rd-party software"

### 2. Node.js (for Frontend)
- Download and install Node.js v18 or later from [https://nodejs.org/](https://nodejs.org/)
- Choose the LTS (Long Term Support) version
- This will also install npm (Node Package Manager)

### 3. Python (for Backend)
- Download and install Python 3.9 or later from [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **Important**: During installation, check "Add Python to PATH"
- Verify installation by opening Command Prompt and running: `python --version`

### 4. Code Editor (Recommended)
- [Visual Studio Code](https://code.visualstudio.com/) - Free and powerful editor
- Alternative: [PyCharm](https://www.jetbrains.com/pycharm/) or any preferred IDE

## Project Setup

### Step 1: Clone the Repository

Open Command Prompt or PowerShell and run:

```bash
git clone <your-repository-url>
cd Z-N-EduHub
```

### Step 2: Backend Setup (Flask/Python)

1. **Navigate to backend directory:**
   ```bash
   cd EduHub_BackEnd
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   # For Command Prompt
   venv\Scripts\activate
   
   # For PowerShell
   venv\Scripts\Activate.ps1
   ```
   
   > **Note**: If you get an execution policy error in PowerShell, run:
   > ```powershell
   > Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   > ```

4. **Install Python dependencies:**
   ```bash
   pip install flask flask-sqlalchemy flask-migrate flask-cors flask-jwt-extended python-dotenv
   ```

5. **Create environment file:**
   Create a `.env` file in the `EduHub_BackEnd` directory:
   ```
   FLASK_APP=run.py
   FLASK_ENV=development
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   DATABASE_URL=sqlite:///eduhub.db
   ```

6. **Initialize the database:**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

7. **Run the backend server:**
   ```bash
   python run.py
   ```
   
   The backend will be available at `http://127.0.0.1:5000`

### Step 3: Frontend Setup (React)

Open a **new** Command Prompt or PowerShell window:

1. **Navigate to frontend directory:**
   ```bash
   cd Z-N-EduHub\EduHub_FrontEnd
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install additional required packages:**
   ```bash
   npm install recharts lucide-react react-router-dom
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:3000`

## Running the Application

### Starting Both Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd Z-N-EduHub\EduHub_BackEnd
venv\Scripts\activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd Z-N-EduHub\EduHub_FrontEnd
npm start
```

### Accessing the Application

1. **Frontend**: Open your browser and go to `http://localhost:3000`
2. **Backend API**: Available at `http://127.0.0.1:5000`
3. **Admin Dashboard**: Navigate to `/admindashboard` after admin login

## Project Structure

```
Z-N-EduHub/
├── EduHub_BackEnd/          # Flask backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py        # Database models
│   │   ├── routes/          # API endpoints
│   │   └── utils/           # Helper utilities
│   ├── migrations/          # Database migrations
│   ├── run.py              # Application entry point
│   └── venv/               # Python virtual environment
├── EduHub_FrontEnd/        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
└── .gitignore
```

## Common Issues and Solutions

### Issue 1: Python not found
**Solution**: Ensure Python is added to PATH during installation. Restart Command Prompt after installation.

### Issue 2: Virtual environment activation fails
**Solution**: 
- For PowerShell: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Use Command Prompt instead of PowerShell

### Issue 3: npm install fails
**Solution**: 
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue 4: Port already in use
**Solution**: 
- Backend: Change port in `run.py` or kill process using port 5000
- Frontend: Use different port when prompted or kill process using port 3000

### Issue 5: Database errors
**Solution**: 
- Delete `eduhub.db` file and run migrations again
- Ensure virtual environment is activated before running Flask commands

## Development Tips

1. **Auto-restart servers:**
   - Backend: Flask auto-reloads in development mode
   - Frontend: React auto-reloads when files change

2. **Debugging:**
   - Use browser developer tools (F12) for frontend debugging
   - Check terminal output for backend errors

3. **Database management:**
   - Use DB Browser for SQLite to view database content
   - Run `flask db migrate` after model changes

## Environment Variables

Create a `.env` file in the backend directory with:

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///eduhub.db
```

## Next Steps

1. **Admin Setup**: Create admin users through the backend
2. **Consultant Setup**: Add consultants to the system
3. **Testing**: Test all features including booking, authentication, and analytics
4. **Production**: Configure for production deployment when ready

## Support

If you encounter any issues:

1. Check the terminal output for error messages
2. Ensure all dependencies are installed correctly
3. Verify that both servers are running
4. Check firewall settings if connection issues occur

## Security Notes

- Change default secret keys before production deployment
- Use environment variables for sensitive configuration
- Enable HTTPS in production
- Regularly update dependencies

---

**Last Updated**: January 2025
**Compatible with**: Windows 10/11, Python 3.9+, Node.js 18+
