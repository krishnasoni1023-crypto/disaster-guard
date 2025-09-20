import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Globe, Shield, User, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificationSettings {
  email_alerts: boolean;
  push_notifications: boolean;
  sms_alerts: boolean;
  disaster_radius_km: number;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

interface PrivacySettings {
  share_location: boolean;
  public_profile: boolean;
  anonymous_reports: boolean;
}

interface ProfileSettings {
  full_name: string;
  mobile: string;
  address: string;
  emergency_contact: string;
}

const Settings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_alerts: true,
    push_notifications: true,
    sms_alerts: false,
    disaster_radius_km: 50
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    share_location: true,
    public_profile: false,
    anonymous_reports: false
  });

  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    full_name: profile?.full_name || '',
    mobile: profile?.mobile || '',
    address: profile?.address || '',
    emergency_contact: profile?.emergency_contact || ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsError && !settingsError.message.includes('no rows')) {
          throw settingsError;
        }

        if (settingsData) {
          setNotificationSettings(settingsData.notifications || notificationSettings);
          setAppearanceSettings(settingsData.appearance || appearanceSettings);
          setPrivacySettings(settingsData.privacy || privacySettings);
        }

        // Apply theme
        const theme = settingsData?.appearance?.theme || 'system';
        applyTheme(theme);

      } catch (err: any) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings. Please try again.');
      }
    };

    loadSettings();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileSettings({
        full_name: profile.full_name || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        emergency_contact: profile.emergency_contact || ''
      });
    }
  }, [profile]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const appliedTheme = theme === 'system' ? systemTheme : theme;
    
    if (appliedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Save user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications: notificationSettings,
          appearance: appearanceSettings,
          privacy: privacySettings,
          updated_at: new Date().toISOString()
        });

      if (settingsError) throw settingsError;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileSettings.full_name,
          mobile: profileSettings.mobile,
          address: profileSettings.address,
          emergency_contact: profileSettings.emergency_contact,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Apply theme
      applyTheme(appearanceSettings.theme);

      // Refresh profile data
      await refreshProfile();

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleAppearanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAppearanceSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account preferences and application settings.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Profile</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileSettings.full_name}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={profileSettings.mobile}
                onChange={handleProfileChange}
                pattern="[0-9]{10}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={profileSettings.address}
                onChange={handleProfileChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Emergency Contact
              </label>
              <input
                type="tel"
                id="emergency_contact"
                name="emergency_contact"
                value={profileSettings.emergency_contact}
                onChange={handleProfileChange}
                pattern="[0-9]{10}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                  Email Alerts
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                id="email_alerts"
                name="email_alerts"
                checked={notificationSettings.email_alerts}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="push_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get alerts on your device</p>
              </div>
              <input
                type="checkbox"
                id="push_notifications"
                name="push_notifications"
                checked={notificationSettings.push_notifications}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="sms_alerts" className="font-medium text-gray-700 dark:text-gray-300">
                  SMS Alerts
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get text message alerts</p>
              </div>
              <input
                type="checkbox"
                id="sms_alerts"
                name="sms_alerts"
                checked={notificationSettings.sms_alerts}
                onChange={handleNotificationChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>

            <div>
              <label htmlFor="disaster_radius_km" className="font-medium text-gray-700 dark:text-gray-300">
                Alert Radius (km)
              </label>
              <input
                type="range"
                id="disaster_radius_km"
                name="disaster_radius_km"
                min="1"
                max="100"
                value={notificationSettings.disaster_radius_km}
                onChange={handleNotificationChange}
                className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get alerts for disasters within {notificationSettings.disaster_radius_km}km
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {appearanceSettings.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              ) : (
                <Sun className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              )}
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label htmlFor="theme" className="block font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <select
                id="theme"
                name="theme"
                value={appearanceSettings.theme}
                onChange={handleAppearanceChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={appearanceSettings.language}
                onChange={handleAppearanceChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
                <option value="kn">Kannada</option>
              </select>
            </div>

            <div>
              <label htmlFor="timezone" className="block font-medium text-gray-700 dark:text-gray-300">
                Time Zone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={appearanceSettings.timezone}
                onChange={handleAppearanceChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="Asia/Kolkata">(GMT+5:30) India Standard Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Privacy</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="share_location" className="font-medium text-gray-700 dark:text-gray-300">
                  Share Location
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow app to access your location</p>
              </div>
              <input
                type="checkbox"
                id="share_location"
                name="share_location"
                checked={privacySettings.share_location}
                onChange={handlePrivacyChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="public_profile" className="font-medium text-gray-700 dark:text-gray-300">
                  Public Profile
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to others</p>
              </div>
              <input
                type="checkbox"
                id="public_profile"
                name="public_profile"
                checked={privacySettings.public_profile}
                onChange={handlePrivacyChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="anonymous_reports" className="font-medium text-gray-700 dark:text-gray-300">
                  Anonymous Reports
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Submit reports without showing your identity</p>
              </div>
              <input
                type="checkbox"
                id="anonymous_reports"
                name="anonymous_reports"
                checked={privacySettings.anonymous_reports}
                onChange={handlePrivacyChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;