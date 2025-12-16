import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { busAPI, bookingAPI, offerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { IndianRupee, User, Calendar, MapPin, Clock, Tag, X } from 'lucide-react';
import Loading from '../components/Loading';

const BookingPage = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: user?.name || '',
    age: '',
    gender: 'Male',
    phone: user?.phone || ''
  });
  const [offerCode, setOfferCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cash'

  const journeyDate = searchParams.get('date');

  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }
    fetchBusDetails();
  }, [busId]);

  const fetchBusDetails = async () => {
    try {
      setLoading(true);
      const response = await busAPI.getBusById(busId);
      console.log('Bus details:', response.data);
      setBus(response.data.bus || response.data);
    } catch (error) {
      console.error('Error fetching bus:', error);
      toast.error('Failed to load bus details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    if (selectedSeats.includes(seat.seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 5) {
        toast.warning('You can select maximum 5 seats');
        return;
      }
      setSelectedSeats([...selectedSeats, seat.seatNumber]);
    }
  };

  const handlePassengerChange = (e) => {
    setPassengerDetails({
      ...passengerDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) {
      toast.error('Please enter offer code');
      return;
    }

    try {
      setOfferLoading(true);
      const baseAmount = selectedSeats.length * (bus.price || 0);
      
      const response = await offerAPI.validateOffer({
        code: offerCode,
        bookingAmount: baseAmount,
        busId: busId,
        route: { from: bus.from, to: bus.to }
      });

      setAppliedOffer(response.data);
      toast.success('Offer applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid offer code');
      setAppliedOffer(null);
    } finally {
      setOfferLoading(false);
    }
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    setOfferCode('');
    toast.info('Offer removed');
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    if (!journeyDate) {
      toast.error('Journey date is missing');
      return;
    }

    console.log('Selected Seats:', selectedSeats);
    console.log('Bus Seat Layout:', bus.seatLayout?.map(s => s.seatNumber));

    try {
      setBookingLoading(true);

      const bookingData = {
        busId: busId,
        passengerDetails,
        seats: selectedSeats,
        journeyDate: journeyDate,
        boardingPoint: bus.from || 'Main Station',
        droppingPoint: bus.to || 'Main Station',
        paymentMethod: paymentMethod
      };

      // Add offer if applied
      if (appliedOffer) {
        bookingData.offerApplied = {
          code: appliedOffer.offer.code,
          discount: appliedOffer.discount,
          originalAmount: appliedOffer.originalAmount
        };
      }

      console.log('Booking Data:', bookingData);

      const response = await bookingAPI.createBooking(bookingData);
      const booking = response.data.booking;

      // If online payment selected, initiate Razorpay
      if (paymentMethod === 'online') {
        await initiatePayment(booking);
      } else {
        toast.success('Booking confirmed successfully!');
        navigate('/my-bookings');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Booking failed';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const initiatePayment = async (booking) => {
    try {
      // Create Razorpay order
      const orderResponse = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: finalAmount,
          bookingId: booking._id
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error('Failed to create payment order');
      }

      // Initialize Razorpay
      const options = {
        key: 'rzp_test_RpTbT93jQSOuQk', 
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'BusBooking',
        description: `Booking: ${booking.bookingId}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          // Payment successful
          await verifyPayment(response, booking._id);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            toast.warning('Payment cancelled. Booking saved but not confirmed.');
            navigate('/my-bookings');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Payment initiation failed. Booking saved but not confirmed.');
      navigate('/my-bookings');
    }
  };

  const verifyPayment = async (paymentResponse, bookingId) => {
    try {
      const response = await fetch('http://localhost:5000/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          bookingId: bookingId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment successful! Booking confirmed.');
        navigate('/my-bookings');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    }
  };

  if (loading) {
    return <Loading message="Loading bus details..." />;
  }

  if (!bus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Bus not found</p>
      </div>
    );
  }

  const totalAmount = selectedSeats.length * (bus.price || 0);
  const finalAmount = appliedOffer ? appliedOffer.finalAmount : totalAmount;
  const discount = appliedOffer ? appliedOffer.discount : 0;

  // Create seat layout (10 rows x 4 columns)
  const rows = 10;
  const seatsPerRow = 4;
  
  // Ensure we have seat layout data
  const seatLayout = [];
  if (bus.seatLayout && bus.seatLayout.length > 0) {
    for (let i = 0; i < rows; i++) {
      const rowSeats = bus.seatLayout.slice(i * seatsPerRow, (i + 1) * seatsPerRow);
      if (rowSeats.length > 0) {
        seatLayout.push(rowSeats);
      }
    }
  } else {
    // Fallback: create default seat layout if not available
    for (let i = 0; i < rows; i++) {
      const rowSeats = [];
      for (let j = 0; j < seatsPerRow; j++) {
        const seatNum = i * seatsPerRow + j + 1;
        if (seatNum <= (bus.totalSeats || 40)) {
          rowSeats.push({
            seatNumber: `S${seatNum}`,
            isBooked: false,
            bookedBy: null
          });
        }
      }
      if (rowSeats.length > 0) {
        seatLayout.push(rowSeats);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bus Details Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{bus.busName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-700">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              <span className="font-medium">{bus.from} → {bus.to}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <span>{new Date(journeyDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <span>{bus.departureTime || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-primary-600" />
              <span className="font-semibold">₹{bus.price} per seat</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Select Seats</h3>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-500 rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-500 rounded"></div>
                  <span>Booked</span>
                </div>
              </div>

              {/* Seat Layout */}
              <div className="bg-gray-100 rounded-lg p-6 overflow-x-auto">
                <div className="text-center mb-6">
                  <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded">
                    Driver
                  </div>
                </div>

                <div className="space-y-3">
                  {seatLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-3">
                      {row.map((seat, seatIndex) => {
                        if (!seat) return <div key={seatIndex} className="w-12 h-12"></div>;
                        
                        const isSelected = selectedSeats.includes(seat.seatNumber);
                        const isBooked = seat.isBooked;

                        let seatClass = 'seat w-12 h-12 rounded flex items-center justify-center font-semibold text-sm cursor-pointer border-2';
                        
                        if (isBooked) {
                          seatClass += ' bg-red-500 text-white border-red-600 cursor-not-allowed';
                        } else if (isSelected) {
                          seatClass += ' bg-orange-500 text-white border-orange-600';
                        } else {
                          seatClass += ' bg-green-500 text-white border-green-600 hover:bg-green-600';
                        }

                        // Add aisle space after 2nd seat
                        const isAisle = seatIndex === 1;

                        return (
                          <React.Fragment key={seat.seatNumber}>
                            <div
                              className={seatClass}
                              onClick={() => handleSeatClick(seat)}
                              title={isBooked ? 'Seat Booked' : isSelected ? 'Selected' : 'Available'}
                            >
                              {seat.seatNumber}
                            </div>
                            {isAisle && <div className="w-8"></div>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>Selected Seats: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
              </div>
            </div>
          </div>

          {/* Passenger Details & Booking Summary */}
          <div className="space-y-6">
            {/* Passenger Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Passenger Details</h3>
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={passengerDetails.name}
                    onChange={handlePassengerChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={passengerDetails.age}
                    onChange={handlePassengerChange}
                    required
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={passengerDetails.gender}
                    onChange={handlePassengerChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={passengerDetails.phone}
                    onChange={handlePassengerChange}
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Pay Now (Online)</span>
                        <p className="text-xs text-gray-600">Credit/Debit Card, UPI, Net Banking</p>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-gray-900">Pay Later (Cash)</span>
                        <p className="text-xs text-gray-600">Pay at boarding point</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="border-t pt-4 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Fare ({selectedSeats.length} seats)</span>
                      <span className="font-medium">₹{totalAmount}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-medium">-₹{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount</span>
                      <span className="text-primary-600">₹{finalAmount}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedSeats.length === 0 || bookingLoading}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {bookingLoading 
                    ? 'Processing...' 
                    : paymentMethod === 'online' 
                      ? `Pay ₹${finalAmount}` 
                      : 'Confirm Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;