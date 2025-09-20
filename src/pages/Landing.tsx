import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Map, Users, BarChart, Zap, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
  >
    <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 text-blue-600 mb-3 sm:mb-4">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-xs sm:text-sm">{description}</p>
  </motion.div>
);

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">DisasterGuard</span>
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/auth" className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
              <Link to="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Get Started
              </Link>
            </nav>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 pb-2"
            >
              <div className="flex flex-col space-y-3">
                <Link
                  to="/auth"
                  className="text-gray-600 hover:text-blue-600 transition-colors py-2 px-4 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </motion.nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-12 sm:py-20 md:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Empowering India's
                <br className="hidden sm:block" />
                Communities,
                <br />
                <span className="text-blue-600">Together in Crisis.</span>
              </h1>
              <p className="mt-4 sm:mt-6 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 px-4 sm:px-0">
                DisasterGuard is India's real-time, community-driven platform for disaster reporting, monitoring, and emergency response.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4 sm:px-0">
                <Link to="/auth" className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg">
                  Join Now
                </Link>
                <Link to="/dashboard" className="bg-white text-gray-800 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-transform hover:scale-105 shadow-lg border border-gray-200">
                  View Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Key Features</h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Everything you need for effective disaster management across India.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              <FeatureCard
                icon={Users}
                title="Citizen Reporting"
                description="Upload images and videos of incidents with GPS tags to alert authorities and the community."
              />
              <FeatureCard
                icon={Map}
                title="Interactive Dashboard"
                description="Visualize reports on a live map, track hotspots, and monitor real-time disaster events."
              />
              <FeatureCard
                icon={BarChart}
                title="Social Media Tracking"
                description="Monitor trending keywords and news from social media to gauge public sentiment and awareness."
              />
              <FeatureCard
                icon={Zap}
                title="Emergency Alerts"
                description="Receive and respond to evacuation alerts, and find the nearest safe shelters instantly."
              />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-12 sm:py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to Make a Difference?</h2>
            <p className="mt-3 sm:mt-4 max-w-xl mx-auto text-sm sm:text-base">
              Join DisasterGuard today and become a vital part of your community's safety net in India. Your report can save lives.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link to="/auth" className="inline-block bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-transform hover:scale-105 shadow-lg">
                Create Your Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-gray-600">
          <p className="text-sm sm:text-base">&copy; {new Date().getFullYear()} DisasterGuard India. All rights reserved.</p>
          <p className="text-xs sm:text-sm mt-2">A community project for a safer India.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
