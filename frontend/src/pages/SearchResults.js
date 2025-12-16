import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { busAPI } from '../services/api';
import { Bus, Clock, MapPin, IndianRupee, Armchair } from 'lucide-react';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    busType: '',
    sortBy: ''
  });

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');

  useEffect(() => {
    if (from && to) {
      searchBuses();
    } else {
      navigate('/');
    }
  }, [from, to]);

  const searchBuses = async () => {
    try {
      setLoading(true);
      const response = await busAPI.searchBuses({ from, to });
      setBuses(response.data.buses);
    } catch (error) {
      toast.error('Failed to fetch buses');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const getFilteredBuses = () => {
    let filtered = [...buses];

    // Filter by bus type
    if (filters.busType) {
      filtered = filtered.filter(bus => bus.busType === filters.busType);
    }

    // Sort
    if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'departure') {
      filtered.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    }

    return filtered;
  };

  const handleSelectBus = (busId) => {
    navigate(`/book/${busId}?date=${date}`);
  };

  if (loading) {
    return <Loading message="Searching for available buses..." />;
  }

  const filteredBuses = getFilteredBuses();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <MapPin className="h-5 w-5 text-primary-600" />
                <span className="font-semibold">{from}</span>
                <span>→</span>
                <span className="font-semibold">{to}</span>
              </div>
              <div className="text-gray-600">
                {new Date(date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 md:mt-0 text-primary-600 hover:text-primary-700 font-medium"
            >
              Modify Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Type
              </label>
              <select
                name="busType"
                value={filters.busType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Sleeper">Sleeper</option>
                <option value="Semi-Sleeper">Semi-Sleeper</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
              >
                <option value="">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="departure">Departure Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-semibold">{filteredBuses.length}</span> buses found
          </p>
        </div>

        {filteredBuses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No buses found
            </h3>
            <p className="text-gray-600 mb-6">
              Try modifying your search criteria
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Search Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBuses.map((bus) => (
              <div
                key={bus._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Bus Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {bus.busName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{bus.busNumber}</p>
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                      {bus.busType}
                    </span>
                    {bus.amenities && bus.amenities.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Amenities: {bus.amenities.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timing */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {bus.departureTime}
                      </p>
                      <p className="text-sm text-gray-600">{from}</p>
                    </div>
                    <div className="flex-1">
                      <Clock className="h-5 w-5 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-600 text-center mt-1">
                        {bus.duration}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {bus.arrivalTime}
                      </p>
                      <p className="text-sm text-gray-600">{to}</p>
                    </div>
                  </div>

                  {/* Price & Seats */}
                  <div className="flex flex-col justify-between items-end">
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1 text-2xl font-bold text-gray-900">
                        <IndianRupee className="h-6 w-6" />
                        <span>{bus.price}</span>
                      </div>
                      <p className="text-sm text-gray-600">per seat</p>
                    </div>

                    <div className="text-right mb-3">
                      <div className="flex items-center space-x-1 text-green-600">
                        <Armchair className="h-5 w-5" />
                        <span className="font-semibold">{bus.availableSeats}</span>
                      </div>
                      <p className="text-xs text-gray-600">seats available</p>
                    </div>

                    <button
                      onClick={() => handleSelectBus(bus._id)}
                      disabled={bus.availableSeats === 0}
                      className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {bus.availableSeats === 0 ? 'Sold Out' : 'Select Seats'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;