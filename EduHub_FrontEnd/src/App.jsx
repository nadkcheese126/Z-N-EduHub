import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserDashboard from './components/UserDashboard';
import UserLogin from './components/UserLogin';
import ConsultantLogin from './components/ConsultantLogin';
import ConsultantDashboard from './components/ConsultantDashboard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/userlogin" />} />
          
          {/* User routes */}
          <Route path="/userlogin" element={<UserLogin />} />
          <Route path="/userdashboard" element={<UserDashboard />} />
          
          {/* Consultant routes */}
          <Route path="/consultantlogin" element={<ConsultantLogin />} />
          <Route path="/consultantdashboard" element={<ConsultantDashboard />} />
          
          {/* Admin routes */}
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          
          {/* Legacy routes for backward compatibility */}
          <Route path="/login" element={<Navigate to="/userlogin" />} />
          <Route path="/consultants" element={<Navigate to="/userdashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
