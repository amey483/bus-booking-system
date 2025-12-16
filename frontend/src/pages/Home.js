import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { busAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

const Home = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [routes, setRoutes] = useState({ fromLocations: [], toLocations: [] });
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: ''
  });

  useEffect(() => {
    // Redirect admin to admin panel
    if (isAdmin()) {
      navigate('/admin');
      return;
    }
    
    fetchRoutes();
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setSearchData(prev => ({ ...prev, date: today }));
  }, [isAdmin, navigate]);

  const fetchRoutes = async () => {
    try {
      const response = await busAPI.getAllRoutes();
      console.log('Routes fetched:', response.data);
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes. Please add buses first.');
    }
  };

  const handleChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchData.from || !searchData.to) {
      toast.error('Please select both departure and destination');
      return;
    }

    if (searchData.from === searchData.to) {
      toast.error('Departure and destination cannot be the same');
      return;
    }

    // Navigate to search results page with query parameters
    navigate(`/search?from=${searchData.from}&to=${searchData.to}&date=${searchData.date}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book Your Bus Tickets Online
            </h1>
            <p className="text-lg md:text-xl text-primary-100">
              Fast, Easy, and Reliable Bus Booking Service
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="from"
                      value={searchData.from}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#6B7280' }}>Select Departure</option>
                      {routes.fromLocations.map((location, index) => (
                        <option key={index} value={location} style={{ color: '#111827' }}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="to"
                      value={searchData.to}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                      style={{ color: '#111827' }}
                    >
                      <option value="" style={{ color: '#6B7280' }}>Select Destination</option>
                      {routes.toLocations.map((location, index) => (
                        <option key={index} value={location} style={{ color: '#111827' }}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journey Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="date"
                      value={searchData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white cursor-pointer"
                      style={{ color: '#111827', colorScheme: 'light' }}
                    />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-lg"
              >
                <Search className="h-6 w-6" />
                <span>Search Buses</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600">
                Search and book bus tickets in just a few clicks
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Routes</h3>
              <p className="text-gray-600">
                Wide network of buses covering major cities
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Cancellation</h3>
              <p className="text-gray-600">
                Easy cancellation with instant refund processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;