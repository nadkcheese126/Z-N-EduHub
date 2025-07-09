import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, GraduationCap, BookOpen, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eduHubLogo from '../Images/eduhub_logo.jpeg';
import axios from 'axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true // Important for cookies to be set
      });
      
      console.log('Login response:', response.data); // Debug log
      
      const { user_type, user_id, access_token } = response.data;
      
      // Store user info and JWT token in localStorage
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('user_type', user_type);
      localStorage.setItem('token', access_token); // Store JWT token for API calls
      
      console.log('Stored in localStorage:', { user_id, user_type, token: access_token }); // Debug log
      
      if (user_type === 'admin') {
        console.log('Navigating to admin dashboard...'); // Debug log
        // Navigate to admin dashboard
        navigate('/admindashboard');
        
        // Set loading to false after a short delay to ensure navigation completes
        setTimeout(() => setIsLoading(false), 1000);
      } else {
        // If someone with different user type tries to log in here, show error
        setErrors({ 
          form: 'Invalid account type. Please use the correct login page.'
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        form: error.response?.data?.error || 'Login failed. Please check your credentials and try again.'
      });
      setIsLoading(false);
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
                EduConsult Pro
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
              <p className="text-sm text-gray-600">Personalized counseling for academic success</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <Users className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Student Success</h3>
              <p className="text-sm text-gray-600">Comprehensive support system</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Growth Tracking</h3>
              <p className="text-sm text-gray-600">Monitor progress and achievements</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20">
              <GraduationCap className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Career Planning</h3>
              <p className="text-sm text-gray-600">Strategic academic pathway design</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <img src={eduHubLogo} alt="EduHub Logo" className="w-8 h-8 object-contain" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  EduHub
                </h1>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
              <p className="text-gray-600">Access your admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Error */}
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.form}
                </div>
              )}
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact{' '}
                <a href="mailto:support@educonsult.com" className="text-blue-600 hover:text-blue-800 font-medium">
                  support@educonsult.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}