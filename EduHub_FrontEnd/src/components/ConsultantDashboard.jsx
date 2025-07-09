import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Phone, MessageSquare, Filter, Search, Bell, LogOut, ChevronLeft, ChevronRight, MapPin, Mail, BookOpen } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import eduHubLogo from '../Images/eduhub_logo.jpeg';

// Using absolute URL for the development environment
const API_BASE_URL = 'http://127.0.0.1:5000/api';

export default function ConsultantDashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('day'); // 'day', 'week', 'month'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
  const [sessions, setSessions] = useState([]);
  const [consultantInfo, setConsultantInfo] = useState({
    name: '',
    email: '',
    specialization: '',
    experience: '',
    totalSessions: 0
  });
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // We only use cookies for authentication, no headers needed
  // The browser automatically sends cookies with withCredentials:true
  
  // Helper function to calculate duration in minutes
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return endMinutes - startMinutes;
  };
  
  // Get consultant ID from localStorage - don't try to access cookies directly
  const getConsultantId = () => {
    return localStorage.getItem('user_id');
  };
  
  // Get access token from localStorage
  const getAccessToken = () => {
    return localStorage.getItem('access_token');
  };

  // Function to fetch sessions based on selected date
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const consultantId = getConsultantId();
      if (!consultantId) {
        console.error('No consultant ID found');
        setLoading(false);
        return;
      }
      const token = getAccessToken();
      // Make the request with the Authorization header
      const response = await axios.get(`${API_BASE_URL}/booking/consultants/${consultantId}/getBookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Map backend fields directly
      const bookingData = response.data.bookings.map(booking => {
        // Normalize date to YYYY-MM-DD
        let normalizedDate = booking.date;
        if (booking.date instanceof Date) {
          normalizedDate = booking.date.toISOString().split('T')[0];
        } else if (typeof booking.date === 'string') {
          const d = new Date(booking.date);
          if (!isNaN(d)) {
            normalizedDate = d.toISOString().split('T')[0];
          }
        }
        return {
          id: booking.booking_id,
          clientName: booking.user_name || `User ${booking.user_id}`,
          clientEmail: booking.user_email || 'Contact details available on confirmation',
          clientPhone: booking.user_phone || 'Contact details available on confirmation',
          date: normalizedDate, // Use normalized date for filtering
          startTime: booking.start_time,
          endTime: booking.end_time,
          time: `${booking.start_time} - ${booking.end_time}`,
          duration: calculateDuration(booking.start_time, booking.end_time),
          type: booking.type || 'video',
          status: booking.status ? booking.status.toLowerCase() : 'pending',
          subject: booking.subject || 'Consultation Session',
          notes: booking.notes || '',
          sessionType: booking.session_type || 'Education Consultation',
          meetingLink: booking.meeting_link || null,
          clientAvatar: null
        };
      });
      setSessions(bookingData);
      setLoading(false); // Always set loading to false after mapping
    } catch (err) {
      console.error('Error fetching sessions:', err);
      if (err.response && err.response.status === 401) {
        navigate('/consultantlogin');
      }
      setLoading(false);
      setError('Failed to load sessions.');
    }
  };

  // Calculate stats based on sessions data
  useEffect(() => {
    if (sessions.length === 0) {
      setStats({
        todaySessions: 0,
        weekSessions: 0,
        totalSessions: 0
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const todayCount = sessions.filter(session => session.date === today).length;
    const weekCount = sessions.filter(session => session.date >= weekAgoStr).length;
    const totalCount = sessions.length;

    setStats({
      todaySessions: todayCount,
      weekSessions: weekCount,
      totalSessions: totalCount
    });
  }, [sessions]);

  useEffect(() => {
    // Check for consultantId
    const consultantId = getConsultantId();
    
    // If no consultant ID, redirect to login
    if (!consultantId) {
      navigate('/consultantlogin');
      return;
    }
    
    // Fetch sessions if authenticated
    fetchSessions();
  }, [navigate]);

  // Filter sessions based on search criteria and status
  const filteredSessions = sessions.filter(session => {
    // First filter by search term
    const matchesSearch = 
      (session.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.subject?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (session.sessionType?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then filter by status if not "all"
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get sessions for selected date
  const getSessionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredSessions.filter(session => session.date === dateStr);
  };

  const todaySessions = getSessionsForDate(selectedDate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Handler for logging out
  const handleLogout = async () => {
    try {
      // Get token from localStorage
      const token = getAccessToken();
      
      // Call logout endpoint with Authorization header
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Server logout successful');
    } catch (err) {
      console.error('Error during logout:', err);
      // Continue with local logout even if the server logout fails
    }
    
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    
    // Navigate back to login page
    navigate('/consultantlogin');
  };

  // Add function to handle session status updates
  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      // Only check for authentication using consultantId
      const consultantId = getConsultantId();
      const token = getAccessToken();
      
      if (!consultantId) {
        alert('Authentication required. Please log in again.');
        navigate('/consultantlogin');
        return;
      }
      
      // Update booking status through API with Authorization header
      await axios.patch(`${API_BASE_URL}/booking/${sessionId}/status`, {
        status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) // Capitalize first letter
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state after successful API call
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId ? {...session, status: newStatus} : session
        )
      );
      
      // Refresh sessions after status update
      fetchSessions();
      
    } catch (err) {
      console.error('Error updating session status:', err);
      alert('Failed to update session status');
    }
  };
  
  // Function to join a video call
  const joinVideoCall = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  // Add effect to filter sessions when date or filter status changes
  useEffect(() => {
    // We don't need to re-fetch from API when these change
    // Just update the UI with filtered sessions
  }, [selectedDate, filterStatus, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img src={eduHubLogo} alt="EduHub Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-gray-900">EduHub</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-gray-900">Consultant Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AR</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{consultantInfo.name}</p>
                  <p className="text-xs text-gray-500">{consultantInfo.specialization}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Stats Cards */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.todaySessions}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.weekSessions}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date Navigation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Selection</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateDate(-1)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => navigateDate(1)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sessions</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content - Sessions List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sessions for {formatDate(selectedDate)}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading sessions...</h3>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Error loading sessions</h3>
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : todaySessions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
                    <p className="text-gray-500">You don't have any sessions booked for this date.</p>
                  </div>
                ) : (
                  todaySessions.map((session) => (
                    <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {session.clientName?.split(' ').map(n => n?.[0] || '').join('') || '?'}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{session.clientName}</h3>
                              <p className="text-sm text-gray-600">{session.subject}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{session.time} ({session.duration} min)</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {getTypeIcon(session.type)}
                                <span className="capitalize">{session.type.replace('-', ' ')}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{session.clientEmail}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <BookOpen className="w-4 h-4" />
                                <span>{session.sessionType}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{session.clientPhone}</span>
                              </div>
                            </div>
                          </div>

                          {session.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Notes:</span> {session.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="ml-6 flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>

                          <div className="flex space-x-2">
                            {session.type === 'video' && session.meetingLink && session.status === 'confirmed' && (
                              <button 
                                onClick={() => joinVideoCall(session.meetingLink)} 
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                Join Call
                              </button>
                            )}
                            {session.status === 'confirmed' && (
                              <button 
                                onClick={() => updateSessionStatus(session.id, 'completed')}
                                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                              >
                                Complete
                              </button>
                            )}
                            <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
