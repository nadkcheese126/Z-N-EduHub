import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, TrendingUp, Download,
  GraduationCap, DollarSign, Star, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real data states
  const [dashboardStats, setDashboardStats] = useState([]);
  const [revenueData, setRevenueData] = useState({ daily: [], monthly: [] });
  const [consultantData, setConsultantData] = useState({ top_consultants: [], utilization: [] });
  const [bookingData, setBookingData] = useState({ daily_trends: [], status_distribution: [], popular_time_slots: [] });
  const [userData, setUserData] = useState({ registration_trends: [], degree_distribution: [], mode_distribution: [], popular_areas: [] });
  const [recentBookings, setRecentBookings] = useState([]);

  // Fetch dashboard data from backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all analytics data
      const [overviewRes, revenueRes, consultantRes, bookingRes, userRes, bookingsRes] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/admin/analytics/overview', { headers }),
        fetch('http://127.0.0.1:5000/api/admin/analytics/revenue', { headers }),
        fetch('http://127.0.0.1:5000/api/admin/analytics/consultants', { headers }),
        fetch('http://127.0.0.1:5000/api/admin/analytics/bookings', { headers }),
        fetch('http://127.0.0.1:5000/api/admin/analytics/users', { headers }),
        fetch('http://127.0.0.1:5000/api/admin/getBookings', { headers })
      ]);

      if (!overviewRes.ok || !revenueRes.ok || !consultantRes.ok || !bookingRes.ok || !userRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const overviewData = await overviewRes.json();
      const revenueAnalytics = await revenueRes.json();
      const consultantAnalytics = await consultantRes.json();
      const bookingAnalytics = await bookingRes.json();
      const userAnalytics = await userRes.json();
      const allBookings = await bookingsRes.json();

      // Transform overview data to dashboard stats
      const overview = overviewData.overview;
      setDashboardStats([
        { 
          title: 'Total Students', 
          value: overview.total_users.toString(), 
          change: '+' + overview.recent_users + ' this week', 
          icon: Users, 
          color: 'blue' 
        },
        { 
          title: 'Sessions This Month', 
          value: overview.confirmed_bookings.toString(), 
          change: '+' + overview.recent_bookings + ' this week', 
          icon: Calendar, 
          color: 'green' 
        },
        { 
          title: 'Revenue', 
          value: 'LKR ' + overview.total_revenue.toLocaleString(), 
          change: '+15%', 
          icon: DollarSign, 
          color: 'purple' 
        },
        { 
          title: 'Total Consultants', 
          value: overview.total_consultants.toString(), 
          change: 'Active', 
          icon: Star, 
          color: 'yellow' 
        }
      ]);

      setRevenueData(revenueAnalytics.revenue_analytics);
      setConsultantData(consultantAnalytics.consultant_analytics);
      setBookingData(bookingAnalytics.booking_analytics);
      setUserData(userAnalytics.user_analytics);
      
      // Set recent bookings (last 5, newest first)
      setRecentBookings(allBookings.bookings.slice(-5).reverse());

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (reportType) => {
    // Simulate download
    alert(`Downloading ${reportType} report...`);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_name');
    
    // Navigate to login page
    navigate('/adminlogin');
  };

  const StatCard = ({ stat }) => {
    const Icon = stat.icon;
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      yellow: 'from-yellow-500 to-yellow-600'
    };

    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/60 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{stat.value}</p>
            <p className="text-sm flex items-center">
              <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
            </p>
          </div>
          <div className={`bg-gradient-to-br ${colorClasses[stat.color]} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    );
  };

  // Loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-200/60">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-purple-600 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-700 font-semibold text-lg">Loading dashboard data...</p>
          <p className="mt-2 text-gray-500">Please wait while we fetch your analytics</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-200/60 max-w-md">
          <div className="text-red-500 text-6xl mb-6">🚨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Dashboard Error</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/60 sticky top-0 z-30">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-3">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EduHub Pro - Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-md group"
            >
              <LogOut className="w-5 h-5 mr-2 group-hover:transform group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Logout</span>
            </button>
            
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          </div>
        </div>
      </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl border border-blue-300/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3 flex items-center">
                <span className="mr-3">👋</span>
                Welcome to Admin Dashboard
              </h2>
              <p className="text-blue-100 text-lg opacity-90">Monitor your educational consultancy performance and analytics in real-time</p>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Analytics Overview</h3>
              <div className="h-1 flex-1 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full ml-6"></div>
            </div>
            
            {/* Revenue and Booking Status Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Trends */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/60 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Booking Trends</h4>
                  <div className="text-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 rounded-full shadow-md">Daily</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bookingData.daily_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Booking Status Distribution */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/60 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Booking Status</h4>
                  <div className="text-sm text-white bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-1 rounded-full shadow-md">Distribution</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingData.status_distribution?.map((item, index) => ({
                        ...item,
                        color: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'][index % 4]
                      })) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {(bookingData.status_distribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#EF4444', '#F59E0B'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Registration Trends - Full Width */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/60 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">User Registrations</h4>
                <div className="text-sm text-white bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 rounded-full shadow-md">Last 7 days</div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userData.registration_trends?.slice(-7) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Bookings
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Consultant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {(recentBookings || []).slice(0, 5).map((booking, index) => (
                    <tr key={booking.id || index} className="hover:bg-blue-50/50 transition-all duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{booking.user_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-medium">{booking.consultant_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-medium">
                          {booking.date && booking.start_time && booking.end_time ? 
                            `${booking.date} at ${booking.start_time} - ${booking.end_time}` : 
                            'Not scheduled'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusColor(booking.status || 'pending')}`}>
                          {booking.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!recentBookings || recentBookings.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-lg font-medium">No recent bookings found</p>
                          <p className="text-sm">New bookings will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
    </div>
  );
}