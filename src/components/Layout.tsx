import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Home, AlertTriangle, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FullPageLoader } from './FullPageLoader';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
  { to: '/report', icon: <AlertTriangle className="h-5 w-5" />, label: 'Report Incident' },
  { to: '/social', icon: <Users className="h-5 w-5" />, label: 'Social Tracker' },
  { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const UserMenu: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Sign Out</span>
    </button>
  );
};

const MobileNav: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Mobile menu */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b">
          <button onClick={onClose} className="p-2">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
              onClick={onClose}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
          <UserMenu />
        </nav>
      </div>
    </>
  );
};

const Layout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">DisasterGuard</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-gray-600"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User menu */}
            <div className="hidden md:block">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      {/* Main content */}
      <main className="flex-1 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
