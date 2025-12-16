import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">BusBooking</span>
            </div>
            <p className="text-sm text-gray-400">
              Your trusted online bus booking platform. Travel comfortably and safely across the country.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-primary-400 transition">
                  My Bookings
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-primary-400 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary-400 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary-400" />
                <span className="text-sm">+91 9876543210</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-400" />
                <span className="text-sm">support@busbooking.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-primary-400 mt-1" />
                <span className="text-sm">123 Main Street, Nagpur, Maharashtra, India</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="hover:text-primary-400 transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary-400 transition">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-primary-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#cancellation" className="hover:text-primary-400 transition">
                  Cancellation Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BusBooking. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;