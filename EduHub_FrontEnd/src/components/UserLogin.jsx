import React, { useState } from 'react';
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, Calendar, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eduHubLogo from '../Images/eduhub_logo.jpeg';
import axios from 'axios';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    areas_of_interest: '',
    degree_level: '',
    mode: 'On-campus'
  });

  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleLoginSubmit = async () => {
    const newErrors = {};

    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
          email: loginData.email,
          password: loginData.password
        });
        
        console.log('Login response:', response.data);
        const { user_type, user_id, access_token, recommendations } = response.data;
        
        // Store auth info in localStorage
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('user_type', user_type);
        
        if (access_token) {
          localStorage.setItem('access_token', access_token);
        }
        
        // Store recommendations if available
        if (recommendations && Array.isArray(recommendations)) {
          console.log('Storing recommendations from login:', recommendations);
          localStorage.setItem('recommendations', JSON.stringify(recommendations));
        }
        
        if (user_type === 'user') {
          // Navigate to user dashboard
          navigate('/userdashboard');
        } else {
          // If someone with different user type tries to log in here, show error
          setErrors({ 
            form: 'Invalid account type. Please use the correct login page.'
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ 
          form: error.response?.data?.error || 'Login failed. Please check your credentials and try again.'
        });
      }
    }
  };

  const handleRegisterSubmit = async () => {
    const newErrors = {};

    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(registerData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!registerData.phone) newErrors.phone = 'Phone number is required';
    if (!registerData.address) newErrors.address = 'Address is required';
    if (!registerData.areas_of_interest) newErrors.areas_of_interest = 'Areas of interest is required';
    if (!registerData.degree_level) newErrors.degree_level = 'Degree level is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Submit registration data to backend
        const response = await axios.post('http://127.0.0.1:5000/api/auth/register/user', {
          email: registerData.email,
          password: registerData.password,
          phone: registerData.phone,
          address: registerData.address,
          areas_of_interest: registerData.areas_of_interest,
          degree_level: registerData.degree_level,
          mode: registerData.mode
        });
        
        console.log('Registration successful:', response.data);
        
        // Auto login after registration if backend returns token
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('user_id', response.data.user_id);
          localStorage.setItem('user_type', 'user');
          
          // Save recommendations to localStorage if they exist in response
          if (response.data.recommendations && Array.isArray(response.data.recommendations)) {
            localStorage.setItem('recommendations', JSON.stringify(response.data.recommendations));
          }
          
          navigate('/userdashboard');
        } else {
          // If no token, switch to login view with success message
          setIsLogin(true);
          setErrors({ form: 'Registration successful! Please login with your credentials.' });
        }
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({
          form: error.response?.data?.error || 'Registration failed. Please try again.'
        });
      }
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <img src={eduHubLogo} alt="EduHub Logo" className="h-20 w-auto rounded-lg shadow-md" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            EduConsult Pro
          </h2>
          <p className="text-gray-600">
            Your pathway to educational excellence
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-6">
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.form}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>

              <button
                onClick={handleLoginSubmit}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          ) : (
            /* Register Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Phone number"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                  <textarea
                    name="address"
                    value={registerData.address}
                    onChange={handleRegisterChange}
                    rows="2"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Enter your address"
                  />
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas of Interest
                </label>
                <select
                  name="areas_of_interest"
                  value={registerData.areas_of_interest}
                  onChange={handleRegisterChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.areas_of_interest ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select your area of interest</option>
                  <option value="Business Management">Business Management</option>
                  <option value="Accounting & Finance">Accounting & Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR Management">HR Management</option>
                  <option value="Logistics/SCM">Logistics/SCM</option>
                  <option value="International Business">International Business</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Business Foundation">Business Foundation</option>
                </select>
                {errors.areas_of_interest && <p className="text-red-500 text-xs mt-1">{errors.areas_of_interest}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Degree Level
                </label>
                <select
                  name="degree_level"
                  value={registerData.degree_level}
                  onChange={handleRegisterChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.degree_level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select degree level</option>
                  <option value="High School">High School</option>
                  <option value="Associate's">Associate's</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
                {errors.degree_level && <p className="text-red-500 text-xs mt-1">{errors.degree_level}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode of Study
                </label>
                <select
                  name="mode"
                  value={registerData.mode}
                  onChange={handleRegisterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="On-campus">On-campus</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  required
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500">
                    Privacy Policy
                  </a>
                </span>
              </div>

              <button
                onClick={handleRegisterSubmit}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;