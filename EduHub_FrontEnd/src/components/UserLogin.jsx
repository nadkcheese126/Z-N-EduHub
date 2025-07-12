import React, { useState } from 'react';
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, Calendar, Phone, MapPin, BookOpen, Users, TrendingUp } from 'lucide-react';
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
    name: '',
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
    if (!registerData.name) newErrors.name = 'name is required';
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
          name: registerData.name,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block text-center lg:text-left">
          <div className="mb-8">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <img src={eduHubLogo} alt="EduHub Logo" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="ml-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Z&N EduHub 
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-8">
              Empowering students to achieve their academic dreams through expert guidance and personalized support.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Expert Guidance</h3>
              <p className="text-sm text-gray-600">Personalized counseling by professionals for academic success</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <Users className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Student Success</h3>
              <p className="text-sm text-gray-600">Comprehensive support system</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Growth Tracking</h3>
              <p className="text-sm text-gray-600">Guidance as students grow in their academic and professional journeys</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <GraduationCap className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Career Planning</h3>
              <p className="text-sm text-gray-600">Strategically bridging career goals with the path of qualifications</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login/Register Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <img src={eduHubLogo} alt="EduHub Logo" className="w-8 h-8 object-contain" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Z&N EduHub
                </h1>
              </div>
              <p className="text-gray-600">
                Your pathway to educational excellence
              </p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Portal</h2>
              <p className="text-gray-600">Access your learning dashboard</p>
            </div>

            {/* Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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

             

              <button
                onClick={handleLoginSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  Name
                </label>
                <div className="relative">
                  <name className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Name"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                 
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
            
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
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Account
              </button>
            </div>
          )}
          
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>
            Need help?{' '}
            <a href="mailto:zneduhub@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Support via zneduhub@gmail.com
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;