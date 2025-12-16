import React, { useState, useEffect } from 'react';
import { busAPI, bookingAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Bus, Plus, Edit, Trash2, BarChart3, Users, IndianRupee, XCircle } from 'lucide-react';
import Loading from '../components/Loading';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, buses, bookings
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBus, setShowAddBus] = useState(false);
  const [newBus, setNewBus] = useState({
    busName: '',
    busNumber: '',
    busType: 'AC',
    from: '',
    to: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    price: '',
    totalSeats: 40,
    amenities: [],
    operatingDays: []
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const response = await bookingAPI.getBookingStats();
        setStats(response.data.stats);
      } else if (activeTab === 'buses') {
        const response = await busAPI.getAllBuses();
        setBuses(response.data.buses);
      } else if (activeTab === 'bookings') {
        const response = await bookingAPI.getAllBookings();
        setBookings(response.data.bookings);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      console.log('Adding bus:', newBus);
      await busAPI.createBus(newBus);
      toast.success('Bus added successfully');
      setShowAddBus(false);
      setNewBus({
        busName: '',
        busNumber: '',
        busType: 'AC',
        from: '',
        to: '',
        departureTime: '',
        arrivalTime: '',
        duration: '',
        price: '',
        totalSeats: 40,
        amenities: [],
        operatingDays: []
      });
      fetchData();
    } catch (error) {
      console.error('Add bus error:', error);
      const message = error.response?.data?.message || 'Failed to add bus';
      toast.error(message);
      
      // Show specific error if duplicate
      if (message.includes('duplicate') || message.includes('E11000')) {
        toast.error('Bus number already exists! Please use a different number.');
      }
    }
  };

  const handleDeleteBus = async (busId) => {
    const confirmed = window.confirm('Are you sure you want to delete this bus?');
    if (!confirmed) return;

    try {
      await busAPI.deleteBus(busId);
      toast.success('Bus deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete bus');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBus({ ...newBus, [name]: value });
  };

  const handleAmenitiesChange = (amenity) => {
    const currentAmenities = newBus.amenities || [];
    if (currentAmenities.includes(amenity)) {
      // Remove amenity
      setNewBus({
        ...newBus,
        amenities: currentAmenities.filter(a => a !== amenity)
      });
    } else {
      // Add amenity
      setNewBus({
        ...newBus,
        amenities: [...currentAmenities, amenity]
      });
    }
  };

  const handleOperatingDaysChange = (day) => {
    const currentDays = newBus.operatingDays || [];
    if (currentDays.includes(day)) {
      // Remove day
      setNewBus({
        ...newBus,
        operatingDays: currentDays.filter(d => d !== day)
      });
    } else {
      // Add day
      setNewBus({
        ...newBus,
        operatingDays: [...currentDays, day]
      });
    }
  };

  if (loading && activeTab === 'overview') {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-white rounded-lg shadow-sm p-2 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'buses'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Manage Buses
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'bookings'
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Bookings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Bookings</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Confirmed</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.confirmedBookings || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Cancelled</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.cancelledBookings || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <IndianRupee className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</p>
              <p className="text-xs text-gray-500 mt-1">From confirmed bookings</p>
            </div>
          </div>
        )}

        {/* Additional Stats Row */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="text-xl font-bold text-green-600">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Refunds:</span>
                  <span className="text-xl font-bold text-red-600">₹{stats.totalRefunds?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-semibold">Net Revenue:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ₹{((stats.totalRevenue || 0) - (stats.totalRefunds || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Booking Value:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString('en-IN') : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cancellation Rate:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats.totalBookings > 0 ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buses Tab */}
        {activeTab === 'buses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Buses</h2>
              <button
                onClick={() => setShowAddBus(!showAddBus)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Bus</span>
              </button>
            </div>

            {/* Add Bus Form */}
            {showAddBus && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Bus</h3>
                <form onSubmit={handleAddBus} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="busName"
                    placeholder="Bus Name"
                    value={newBus.busName}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="busNumber"
                    placeholder="Bus Number (e.g., MH12AB1234)"
                    value={newBus.busNumber}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <select
                    name="busType"
                    value={newBus.busType}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                    <option value="Semi-Sleeper">Semi-Sleeper</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                  <input
                    type="text"
                    name="from"
                    placeholder="From (e.g., Mumbai)"
                    value={newBus.from}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="to"
                    placeholder="To (e.g., Pune)"
                    value={newBus.to}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="time"
                    name="departureTime"
                    value={newBus.departureTime}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="time"
                    name="arrivalTime"
                    value={newBus.arrivalTime}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="duration"
                    placeholder="Duration (e.g., 3h 30m)"
                    value={newBus.duration}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Price per seat"
                    value={newBus.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="number"
                    name="totalSeats"
                    placeholder="Total Seats"
                    value={newBus.totalSeats}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />

                  {/* Amenities Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Amenities (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Pillow', 'Snacks', 'TV', 'Reading Light'].map((amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={newBus.amenities?.includes(amenity)}
                            onChange={() => handleAmenitiesChange(amenity)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Operating Days Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Operating Days (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label
                          key={day}
                          className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={newBus.operatingDays?.includes(day)}
                            onChange={() => handleOperatingDaysChange(day)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex space-x-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      Add Bus
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBus(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Buses List */}
            {loading ? (
              <Loading message="Loading buses..." />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {buses.map((bus) => (
                  <div key={bus._id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{bus.busName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{bus.busNumber}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Type: </span>
                            <span className="font-medium">{bus.busType}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Route: </span>
                            <span className="font-medium">{bus.from} → {bus.to}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price: </span>
                            <span className="font-medium">₹{bus.price}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Seats: </span>
                            <span className="font-medium">{bus.availableSeats}/{bus.totalSeats}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBus(bus._id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h2>
            {loading ? (
              <Loading message="Loading bookings..." />
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passenger</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.bookingId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {booking.user?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {booking.bus?.busName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {booking.seats.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ₹{booking.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.bookingStatus === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;