import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Mail, Lock, User, Phone, Home, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    mobile: '',
    aadhaar: '',
    address: ''
  });

  useEffect(() => {
    if (session) {
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createProfile = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').insert([
        {
          id: userId,
          full_name: formData.fullName,
          mobile: formData.mobile,
          aadhaar: formData.aadhaar || null,
          address: formData.address,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw new Error('Failed to create profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        if (data.user?.identities?.length === 0) {
          setError("This email is already registered. Please try signing in.");
          return;
        }

        if (data.user) {
          await createProfile(data.user.id);
          setMessage('Success! Please check your email to verify your account.');
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const from = (location.state as { from?: string })?.from || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'error_description' in err) {
        setError((err as { error_description: string }).error_description);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Join DisasterGuard to help your community in India' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <AuthInput
                icon={User}
                name="fullName"
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            )}
            <AuthInput
              icon={Mail}
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <AuthInput
              icon={Lock}
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {isSignUp && (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="absolute inset-y-0 left-10 pl-1 flex items-center text-gray-500 sm:text-sm">
                    +91
                  </span>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="appearance-none relative block w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Mobile Number"
                    value={formData.mobile}
                    onChange={handleInputChange}
                  />
                </div>
                <AuthInput
                  icon={CreditCard}
                  name="aadhaar"
                  type="text"
                  placeholder="Aadhaar Number (Optional)"
                  pattern="[0-9]{12}"
                  maxLength={12}
                  value={formData.aadhaar}
                  onChange={handleInputChange}
                />
                <div>
                  <label htmlFor="address" className="sr-only">Current Address</label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={3}
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Current Address (e.g. 123, MG Road, Bangalore)"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {message && <p className="text-sm text-green-600 text-center">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
                setFormData({
                  email: '',
                  password: '',
                  fullName: '',
                  mobile: '',
                  aadhaar: '',
                  address: ''
                });
              }}
              className="font-medium text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AuthInputProps {
  icon: React.ElementType;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  pattern?: string;
  maxLength?: number;
}

const AuthInput: React.FC<AuthInputProps> = ({ 
  icon: Icon, 
  name, 
  type, 
  placeholder, 
  value, 
  onChange, 
  required,
  pattern,
  maxLength 
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      id={name}
      name={name}
      type={type}
      required={required}
      pattern={pattern}
      maxLength={maxLength}
      className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default AuthPage;
