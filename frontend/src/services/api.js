import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Bus APIs
export const busAPI = {
  getAllBuses: (params) => api.get('/buses', { params }),
  searchBuses: (params) => api.get('/buses/search', { params }),
  getBusById: (id) => api.get(`/buses/${id}`),
  getBusSeats: (id) => api.get(`/buses/${id}/seats`),
  getAllRoutes: () => api.get('/buses/routes/all'),

  // Admin only
  createBus: (data) => api.post('/buses', data),
  updateBus: (id, data) => api.put(`/buses/${id}`, data),
  deleteBus: (id) => api.delete(`/buses/${id}`)
};

// Booking APIs
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  downloadTicket: (id) => api.get(`/bookings/${id}/download`, { responseType: 'blob' }),

  // Admin only
  getAllBookings: (params) => api.get('/bookings/admin/all', { params }),
  getBookingStats: () => api.get('/bookings/admin/stats')
};

// Payment APIs
export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  processRefund: (bookingId) => api.post(`/payment/refund/${bookingId}`)
};
// Review APIs
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getBusReviews: (busId, params) => api.get(`/reviews/bus/${busId}`, { params }),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  canReviewBooking: (bookingId) => api.get(`/reviews/can-review/${bookingId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),

  // Admin only
  respondToReview: (id, data) => api.put(`/reviews/${id}/response`, data)
};

// Offer APIs
export const offerAPI = {
  getActiveOffers: () => api.get('/offers'),
  validateOffer: (data) => api.post('/offers/validate', data),
  getOfferByCode: (code) => api.get(`/offers/${code}`),

  // Admin only
  createOffer: (data) => api.post('/offers', data),
  getAllOffers: () => api.get('/offers/admin/all'),
  updateOffer: (id, data) => api.put(`/offers/${id}`, data),
  deleteOffer: (id) => api.delete(`/offers/${id}`)
};

export default api;