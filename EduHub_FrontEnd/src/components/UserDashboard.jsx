import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, GraduationCap, Award, Users, ChevronLeft, CheckCircle, LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eduHubLogo from '../Images/eduhub_logo.jpeg';

const EducationConsultancyApp = () => {
  const navigate = useNavigate();
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingStep, setBookingStep] = useState('consultants'); // consultants, booking, confirmation, payment
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  // State variables for recommendations and consultant data
  const [recommendations, setRecommendations] = useState([]);
  const [backendConsultants, setBackendConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State variables for time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  // State for available time slots from backend
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Helper functions for calendar
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDateAvailable = (date) => {
    const today = new Date();
    const dayOfWeek = date.getDay();
    // Available Monday to Friday, not in the past
    return date >= today && dayOfWeek >= 1 && dayOfWeek <= 5;
  };

  const isSameDate = (date1, date2) => {
    return date1 && date2 && 
           date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Function to generate time slots for consultants
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const formattedHour = hour > 12 ? hour - 12 : hour;
      const amPm = hour < 12 ? 'AM' : 'PM';
      slots.push(`${formattedHour}:00 ${amPm}`);
      if (hour !== 17) {
        slots.push(`${formattedHour}:30 ${amPm}`);
      }
    }
    return slots;
  };

  const handleBookConsultant = (consultant) => {
    setSelectedConsultant(consultant);
    setBookingStep('booking');
    // Reset time slot related state
    setAvailableTimeSlots([]);
    setSelectedTimeSlot(null);
    setSelectedSlotId(null);
    setTimeSlotsError(null);
  };

  const handleTimeSlotSelect = (timeSlot, slotId = null) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedSlotId(slotId); // Store the slot ID for booking submission
  };

  const handleDateSelect = (date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTimeSlot(null); // Reset time slot when date changes
      setSelectedSlotId(null); // Reset slot ID when date changes
      
      // Fetch available time slots for the selected consultant and date
      if (selectedConsultant) {
        fetchTimeSlots(selectedConsultant.id, date);
      }
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentFormChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      value = value.substring(0, 19); // Limit to 19 characters (16 digits + 3 spaces)
    }
    
    // Limit CVV to 3 digits
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 3);
    }
    
    // Limit expiry month to 2 digits
    if (name === 'expiryMonth') {
      value = value.replace(/\D/g, '').substring(0, 2);
      if (parseInt(value) > 12) value = '12';
    }
    
    // Limit expiry year to 4 digits
    if (name === 'expiryYear') {
      value = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setPaymentForm({
      ...paymentForm,
      [name]: value
    });
  };

  const handlePaymentSubmit = async () => {
    if (!bookingResult?.booking_id) {
      alert('No booking found to process payment');
      return;
    }
    
    // Validate payment form
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = paymentForm;
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      alert('Please fill in all payment details');
      return;
    }
    
    setPaymentLoading(true);
    setPaymentError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://127.0.0.1:5000/api/booking/payment/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingResult.booking_id,
          card_number: cardNumber.replace(/\s/g, ''), // Remove spaces
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cvv,
          cardholder_name: cardholderName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Payment successful:', result);
      
      // Update booking result with payment info
      setBookingResult({
        ...bookingResult,
        transaction_id: result.transaction_id,
        status: result.status
      });
      
      setBookingStep('confirmation');
    } catch (err) {
      console.error('Error processing payment:', err);
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Function to fetch all time slots for a consultant
  const fetchTimeSlots = async (consultantId, selectedDate) => {
    if (!consultantId || !selectedDate) return;
    
    setTimeSlotsLoading(true);
    setTimeSlotsError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/booking/consultants/${consultantId}/timeslots`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const allSlots = data.timeslots || [];
      
      // Filter slots by the selected date on the frontend
      const dateStr = selectedDate.toISOString().split('T')[0];
      const filteredSlots = allSlots.filter(slot => {
        // Assuming the slot has a date field or we can extract date from slot data
        // Adjust this logic based on your actual slot data structure
        return slot.date === dateStr || slot.slot_date === dateStr;
      });
      
      setAvailableTimeSlots(filteredSlots);
      setSelectedSlotId(null); // Reset slot selection when new slots are loaded
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setTimeSlotsError('Failed to fetch available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setTimeSlotsLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (selectedDate && selectedTimeSlot && selectedSlotId) {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Call the booking API with the slot ID
        const response = await fetch('http://127.0.0.1:5000/api/booking/createBooking', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            time_slot_id: selectedSlotId,
            notes: bookingForm.message || ""
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Booking successful:', result);
        setBookingResult(result);
        
        // If booking requires payment, go to payment step
        if (result.requires_payment) {
          setBookingStep('payment');
        } else {
          setBookingStep('confirmation');
        }
      } catch (err) {
        console.error('Error submitting booking:', err);
        alert('Failed to book appointment. Please try again.');
      }
    } else {
      alert('Please select a date and time slot.');
    }
  };

  const resetBooking = () => {
    setSelectedConsultant(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedSlotId(null);
    setAvailableTimeSlots([]);
    setTimeSlotsError(null);
    setBookingStep('consultants');
    setCurrentMonth(new Date());
    setBookingForm({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
    setPaymentForm({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: ''
    });
    setBookingResult(null);
    setPaymentError(null);
  };

  // Function to store recommendations data from registration
  const storeRecommendationsFromUrl = () => {
    // Check if this is a redirect from registration with recommendations
    const params = new URLSearchParams(window.location.search);
    const recommendationsParam = params.get('recommendations');
    
    if (recommendationsParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(recommendationsParam));
        if (decodedData && Array.isArray(decodedData)) {
          // Store in state and localStorage
          setRecommendations(decodedData);
          localStorage.setItem('recommendations', JSON.stringify(decodedData));
          
          // Clean up the URL by removing the query parameter
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        console.error('Error parsing recommendations from URL:', err);
      }
    }
  };

  // Effect to fetch consultant details from backend when component mounts
  useEffect(() => {
    // Check for recommendations in localStorage (set during registration)
    const storedRecommendations = localStorage.getItem('recommendations');
    if (storedRecommendations) {
      try {
        const parsedRecommendations = JSON.parse(storedRecommendations);
        console.log('Loaded recommendations from localStorage:', parsedRecommendations);
        setRecommendations(parsedRecommendations);
      } catch (err) {
        console.error('Error parsing stored recommendations:', err);
      }
    } else {
      console.log('No recommendations found in localStorage');
    }

    // Fetch consultant details from backend API
    const fetchConsultants = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching consultant details with token:', token);
        
        const response = await fetch('http://127.0.0.1:5000/api/consultation/getConsultantDetails', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Consultant data received:', data);
        
        if (data.consultants && Array.isArray(data.consultants)) {
          console.log(`Received ${data.consultants.length} consultants from API`);
          setBackendConsultants(data.consultants);
        } else {
          console.warn('No consultants array in response:', data);
          setBackendConsultants([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching consultant details:', err);
        
        // More detailed error reporting
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          console.error('Network error - Make sure your Flask backend is running at http://127.0.0.1:5000');
          setError('Network error: Unable to connect to the backend server');
        } else {
          setError(err.message);
        }
        
        setLoading(false);
      }
    };

    fetchConsultants();
    storeRecommendationsFromUrl();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    navigate('/login');
  };

  if (bookingStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">Your appointment has been successfully scheduled.</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Appointment Details</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Consultant:</strong> {selectedConsultant.name}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Date:</strong> {formatDate(selectedDate)}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Time:</strong> {selectedTimeSlot}
            </p>
            {bookingResult?.transaction_id && (
              <p className="text-sm text-gray-600 mb-1">
                <strong>Transaction ID:</strong> {bookingResult.transaction_id}
              </p>
            )}
            {bookingResult?.status && (
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> <span className="text-green-600 font-medium">{bookingResult.status}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={resetBooking}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Book Another Appointment
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingStep === 'payment' && bookingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setBookingStep('booking')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Booking
          </button>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Payment Portal</h1>
              <p className="opacity-90">Complete your booking payment</p>
            </div>

            <div className="p-6">
              {/* Booking Summary */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Consultant:</p>
                    <p className="font-medium">{bookingResult.consultant_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date:</p>
                    <p className="font-medium">{bookingResult.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time:</p>
                    <p className="font-medium">{bookingResult.time}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount:</p>
                    <p className="font-medium text-green-600">LKR {bookingResult.amount}</p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
                
                {paymentError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{paymentError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={paymentForm.cardholderName}
                      onChange={handlePaymentFormChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={handlePaymentFormChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Month
                      </label>
                      <input
                        type="text"
                        name="expiryMonth"
                        value={paymentForm.expiryMonth}
                        onChange={handlePaymentFormChange}
                        placeholder="12"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                      </label>
                      <input
                        type="text"
                        name="expiryYear"
                        value={paymentForm.expiryYear}
                        onChange={handlePaymentFormChange}
                        placeholder="2025"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentForm.cvv}
                        onChange={handlePaymentFormChange}
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Cards Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Test Card Numbers:</h4>
                  <div className="text-xs text-blue-600 space-y-1">
                    <p><strong>4111111111111111</strong> - Successful payment</p>
                    <p><strong>4000000000000002</strong> - Insufficient funds</p>
                    <p><strong>4000000000000119</strong> - Invalid card</p>
                  </div>
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={paymentLoading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-colors ${
                    paymentLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {paymentLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay LKR ${bookingResult.amount}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookingStep === 'booking' && selectedConsultant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setBookingStep('consultants')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Consultants
          </button>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Book Appointment</h1>
              <p className="opacity-90">Schedule your session with {selectedConsultant.name}</p>
            </div>

            <div className="p-6">
              <div className="space-y-8">
                <div>
                  <div className="flex items-start space-x-4 mb-6">
                    {/* Generate avatar SVG if image is not available */}
                    <img
                      src={selectedConsultant.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%234F46E5'/%3E%3Ctext x='200' y='220' font-family='Arial' font-size='120' fill='white' text-anchor='middle'%3E${selectedConsultant.name ? selectedConsultant.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CC'}%3C/text%3E%3C/svg%3E`}
                      alt={selectedConsultant.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{selectedConsultant.name}</h3>
                      <p className="text-indigo-600 font-medium">{selectedConsultant.title || "Education Consultant"}</p>
                      <p className="text-gray-600">{selectedConsultant.hourly_rate ? `LKR ${selectedConsultant.hourly_rate}` : "LKR 5000"}/hour</p>
                    </div>
                  </div>
                </div>

                {/* Calendar Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Select Date
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h5 className="text-lg font-semibold text-gray-800">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h5>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                        <div key={`empty-${index}`} className="p-2"></div>
                      ))}
                      
                      {/* Calendar days */}
                      {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
                        const isAvailable = isDateAvailable(date);
                        const isSelected = isSameDate(date, selectedDate);
                        
                        return (
                          <button
                            key={index + 1}
                            onClick={() => handleDateSelect(date)}
                            disabled={!isAvailable}
                            className={`p-2 text-sm rounded-lg transition-all ${isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : isAvailable
                                ? 'hover:bg-indigo-100 text-gray-800 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                              }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {selectedDate && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-800 font-medium">
                          Selected: {formatDate(selectedDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Slots Section */}
                {selectedDate && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Available Time Slots
                    </h4>
                    
                    {timeSlotsLoading && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-600 mt-2">Loading available time slots...</p>
                      </div>
                    )}
                    
                    {timeSlotsError && (
                      <div className="text-center py-4">
                        <p className="text-red-600">{timeSlotsError}</p>
                        <button 
                          onClick={() => fetchTimeSlots(selectedConsultant.id, selectedDate)}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                    
                    {!timeSlotsLoading && !timeSlotsError && availableTimeSlots.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-600">No available time slots for this date.</p>
                      </div>
                    )}
                    
                    {!timeSlotsLoading && !timeSlotsError && availableTimeSlots.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {availableTimeSlots.map((slotData) => {
                          const timeDisplay = `${slotData.start_time} - ${slotData.end_time}`;
                          return (
                            <button
                              key={slotData.id}
                              onClick={() => handleTimeSlotSelect(timeDisplay, slotData.id)}
                              className={`p-3 rounded-lg border-2 transition-all ${selectedSlotId === slotData.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                                : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                                }`}
                            >
                              {timeDisplay}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={bookingForm.message}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell us about your goals or specific questions..."
                  />
                </div>

                <button
                  onClick={handleBookingSubmit}
                  disabled={!selectedDate || !selectedTimeSlot || !selectedSlotId}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${selectedDate && selectedTimeSlot && selectedSlotId
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EduConsult Pro</h1>
                <p className="text-gray-600">Your pathway to academic success</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  500+ Students Helped
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  95% Success Rate
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 ? (
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Personalized Program Recommendations
              </h2>
              <p className="text-gray-600 mb-6">
                Based on your profile and interests, we've selected these programs that might be perfect for you:
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {recommendations.map((program, index) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                    <div className="mb-3">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {program.area_of_study}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                        {program.degree_level}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{program.program_name}</h3>
                    <p className="text-indigo-700 font-medium mb-2">{program.university_name}</p>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <div className="flex items-start">
                        <span className="font-medium mr-2">Duration:</span> {program.duration}
                      </div>
                      <div className="flex items-start">
                        <span className="font-medium mr-2">Mode:</span> {program.mode}
                      </div>
                      <div className="flex items-start">
                        <span className="font-medium mr-2">Requirements:</span> {program.requirements}
                      </div>
                      <div className="flex items-start">
                        <span className="font-medium mr-2">Fee:</span> Rs. {program.fee.toLocaleString()}
                      </div>
                    </div>
                    
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                      Learn More
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12 text-center">
            <p className="text-gray-600">No program recommendations found. Explore our consultants below to get personalized guidance.</p>
          </div>
        )}

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meet Our Expert Consultants
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with experienced education professionals who will guide you through every step of your academic journey
          </p>
        </div>

        {/* Consultants Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-2 text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading consultant details...</p>
            </div>
          ) : error ? (
            <div className="col-span-2 text-center py-12 bg-red-50 rounded-xl p-6">
              <p className="text-red-600">Error loading consultants: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : backendConsultants.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl p-6">
              <p className="text-gray-600">No consultants available at this time. Please check back later.</p>
            </div>
          ) : (
            backendConsultants.map((consultant) => {
              // Generate an SVG avatar with initials if image is not available
              const initials = consultant.name ? consultant.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CC';
              const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
              const colorIndex = consultant.id % colors.length;
              const avatarSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='${colors[colorIndex].replace('#', '%23')}'/%3E%3Ctext x='200' y='220' font-family='Arial' font-size='120' fill='white' text-anchor='middle'%3E${initials}%3C/text%3E%3C/svg%3E`;

              return (
                <div
                  key={consultant.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={consultant.image || avatarSvg}
                        alt={consultant.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {consultant.name}
                        </h3>
                        <p className="text-indigo-600 font-medium mb-2">
                          {consultant.title || "Education Consultant"}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {consultant.address || "Location not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{consultant.hourly_rate ? `LKR ${consultant.hourly_rate}` : "LKR 5000"}</p>
                        <p className="text-sm text-gray-600">per hour</p>
                      </div>
                    </div>

                    {(consultant.presence || consultant.shift) && (
                      <div className="mb-3">
                        {consultant.presence && (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mr-2 ${
                            consultant.presence.toLowerCase() === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {consultant.presence}
                          </span>
                        )}
                        {consultant.shift && (
                          <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            {consultant.shift} Shift
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {consultant.bio || `${consultant.name} is an experienced education consultant who provides personalized guidance to students.`}
                    </p>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Contact Information</h4>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {consultant.email}
                      </p>
                      {consultant.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {consultant.phone}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleBookConsultant(consultant)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our expert consultants are here to help you achieve your academic and career goals. 
              Book a consultation today and take the first step towards your bright future.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Personalized Guidance
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Proven Success Record
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Flexible Scheduling
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationConsultancyApp;
