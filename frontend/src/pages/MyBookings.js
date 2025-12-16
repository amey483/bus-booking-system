import React, { useState, useEffect } from 'react';
import { bookingAPI, reviewAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Ticket, Calendar, MapPin, IndianRupee, XCircle, CheckCircle, Clock, Download, Star } from 'lucide-react';
import Loading from '../components/Loading';
import ReviewModal from '../components/ReviewModal';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking? You will receive 80% refund.');
    
    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      await bookingAPI.cancelBooking(bookingId, { reason: 'User cancelled' });
      toast.success('Booking cancelled successfully');
      fetchBookings(); // Refresh bookings
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  const getFilteredBookings = () => {
    if (filter === 'confirmed') {
      return bookings.filter(b => b.bookingStatus === 'confirmed');
    } else if (filter === 'cancelled') {
      return bookings.filter(b => b.bookingStatus === 'cancelled');
    }
    return bookings;
  };

  const canCancelBooking = (booking) => {
    if (booking.bookingStatus === 'cancelled') return false;
    const journeyDate = new Date(booking.journeyDate);
    const currentDate = new Date();
    return journeyDate > currentDate;
  };

  const handleDownloadTicket = async (bookingId) => {
    try {
      setDownloadingId(bookingId);
      const response = await bookingAPI.downloadTicket(bookingId);
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      toast.error('Failed to download ticket');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    fetchBookings();
  };

  if (loading) {
    return <Loading message="Loading your bookings..." />;
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your bus bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 bg-white rounded-lg shadow-sm p-2 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'confirmed'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Confirmed ({bookings.filter(b => b.bookingStatus === 'confirmed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'cancelled'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled ({bookings.filter(b => b.bookingStatus === 'cancelled').length})
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't booked any tickets yet"
                : `No ${filter} bookings found`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.bus.busName}
                        </h3>
                        {booking.bookingStatus === 'confirmed' ? (
                          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Confirmed</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                            <XCircle className="h-4 w-4" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Booking ID: <span className="font-semibold">{booking.bookingId}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Booked on: {new Date(booking.bookingDate).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                      <div className="flex items-center justify-end space-x-1 text-2xl font-bold text-gray-900">
                        <IndianRupee className="h-6 w-6" />
                        <span>{booking.totalAmount}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Journey Details */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.bus.from} → {booking.bus.to}
                        </p>
                        <p className="text-xs text-gray-600">Route</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(booking.journeyDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-600">Journey Date</p>
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="flex items-start space-x-2">
                      <Clock className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.bus.departureTime}
                        </p>
                        <p className="text-xs text-gray-600">Departure</p>
                      </div>
                    </div>

                    {/* Seats */}
                    <div className="flex items-start space-x-2">
                      <Ticket className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.seats.join(', ')}
                        </p>
                        <p className="text-xs text-gray-600">Seat Numbers</p>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Passenger Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name: </span>
                        <span className="font-medium">{booking.passengerDetails.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Age: </span>
                        <span className="font-medium">{booking.passengerDetails.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Gender: </span>
                        <span className="font-medium">{booking.passengerDetails.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone: </span>
                        <span className="font-medium">{booking.passengerDetails.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Info */}
                  {booking.bookingStatus === 'cancelled' && booking.cancellation.isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">Cancelled on: </span>
                        {new Date(booking.cancellation.cancelledAt).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">Refund Amount: </span>
                        ₹{booking.cancellation.refundAmount}
                      </p>
                      {booking.cancellation.cancellationReason && (
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Reason: </span>
                          {booking.cancellation.cancellationReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {booking.bookingStatus === 'confirmed' && canCancelBooking(booking) && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleDownloadTicket(booking._id)}
                        disabled={downloadingId === booking._id}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 text-sm font-medium"
                      >
                        <Download className="h-4 w-4" />
                        <span>{downloadingId === booking._id ? 'Downloading...' : 'Download Ticket'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleOpenReviewModal(booking)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        <Star className="h-4 w-4" />
                        <span>Write Review</span>
                      </button>
                      
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>{cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}</span>
                      </button>
                    </div>
                  )}

                  {/* Message for past bookings */}
                  {booking.bookingStatus === 'confirmed' && !canCancelBooking(booking) && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 italic">
                        This booking cannot be cancelled as the journey date has passed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {reviewModalOpen && selectedBooking && (
          <ReviewModal
            booking={selectedBooking}
            onClose={() => setReviewModalOpen(false)}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default MyBookings;