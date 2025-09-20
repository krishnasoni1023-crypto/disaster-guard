import React, { useState, useEffect } from 'react';
import { MapPin, Upload, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FormData {
  incident_type: string;
  severity: string;
  description: string;
  hashtags: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

interface MediaPreview {
  file: File;
  preview: string;
}

const CitizenApp: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>({
    incident_type: '',
    severity: 'medium',
    description: '',
    hashtags: '',
    location: null
  });

  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the bucket exists
    const checkBucket = async () => {
      try {
        const { data: bucketExists, error: bucketError } = await supabase
          .storage
          .getBucket('citizen-app-media');

        if (bucketError && !bucketExists) {
          const { error: createError } = await supabase
            .storage
            .createBucket('citizen-app-media', {
              public: false,
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
              fileSizeLimit: 52428800 // 50MB
            });

          if (createError) throw createError;
        }
      } catch (err: any) {
        console.error('Error checking/creating bucket:', err);
        setError('Failed to initialize media storage. Please try again.');
      }
    };

    checkBucket();
  }, []);

  const handleLocationAccess = async () => {
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const address = await getLocationName(latitude, longitude);

      setForm(prev => ({
        ...prev,
        location: {
          latitude,
          longitude,
          address
        }
      }));
    } catch (err: any) {
      console.error('Location error:', err);
      let errorMessage = 'Failed to access location. Please try again.';

      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      setLocationError(errorMessage);
    }
  };

  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (err) {
      console.error('Error getting location name:', err);
      return 'Unknown location';
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: MediaPreview[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File type ${file.type} is not supported. Please use JPG, PNG, GIF, or MP4.`);
        return;
      }

      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      newMedia.push({
        file,
        preview: URL.createObjectURL(file)
      });
    });

    setMedia(prev => [...prev, ...newMedia]);
    e.target.value = ''; // Reset input
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      // Validate form
      if (!form.incident_type || !form.severity || !form.description) {
        throw new Error('Please fill in all required fields.');
      }

      if (!form.location) {
        throw new Error('Please add your location.');
      }

      // Upload media files
      const mediaUrls = await Promise.all(
        media.map(async (m) => {
          const fileExt = m.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('citizen-app-media')
            .upload(filePath, m.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('citizen-app-media')
            .getPublicUrl(filePath);

          return publicUrl;
        })
      );

      // Save incident report
      const { error: reportError } = await supabase
        .from('citizen_reports')
        .insert({
          user_id: user.id,
          incident_type: form.incident_type,
          severity: form.severity,
          description: form.description,
          hashtags: form.hashtags.split(',').map(tag => tag.trim()),
          location: form.location,
          media_urls: mediaUrls,
          created_at: new Date().toISOString()
        });

      if (reportError) throw reportError;

      // Clear form and media
      setForm({
        incident_type: '',
        severity: 'medium',
        description: '',
        hashtags: '',
        location: null
      });
      
      media.forEach(m => URL.revokeObjectURL(m.preview));
      setMedia([]);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Citizen App</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Report incidents and help keep your community safe.
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
          <p className="text-sm text-green-700 dark:text-green-400">
            Report submitted successfully! Thank you for helping keep the community safe.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="incident_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Incident Type *
          </label>
          <select
            id="incident_type"
            value={form.incident_type}
            onChange={(e) => setForm(prev => ({ ...prev, incident_type: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            required
          >
            <option value="">Select incident type</option>
            <option value="accident">Accident</option>
            <option value="fire">Fire</option>
            <option value="medical">Medical Emergency</option>
            <option value="crime">Crime</option>
            <option value="natural_disaster">Natural Disaster</option>
            <option value="infrastructure">Infrastructure Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Severity Level *
          </label>
          <select
            id="severity"
            value={form.severity}
            onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description *
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            placeholder="Describe the incident in detail..."
            required
          />
        </div>

        <div>
          <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hashtags
          </label>
          <input
            type="text"
            id="hashtags"
            value={form.hashtags}
            onChange={(e) => setForm(prev => ({ ...prev, hashtags: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            placeholder="Add comma-separated hashtags, e.g., #emergency, #help"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Location *
          </label>
          <div className="mt-1">
            {form.location ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{form.location.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, location: null }))}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLocationAccess}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Add Location
              </button>
            )}
            {locationError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Media
          </label>
          <div className="mt-1">
            <div className="flex flex-wrap gap-4 mb-4">
              {media.map((m, index) => (
                <div key={index} className="relative">
                  <img
                    src={m.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Upload className="h-5 w-5 mr-2" />
              Add Photos/Videos
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,video/mp4"
                onChange={handleMediaChange}
                multiple
                className="hidden"
              />
            </label>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Supported formats: JPG, PNG, GIF, MP4 (max 50MB each)
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitizenApp;
