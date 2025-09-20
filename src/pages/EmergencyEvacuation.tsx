import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, CheckCircle, X, Navigation, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tables } from '../types/database.types';

type Alert = Tables<'alerts'>;
type Shelter = Tables<'shelters'>;
type AlertResponse = Enums<'response_type'>;

interface EvacuationAlert extends Alert {
  responded: boolean;
  response?: AlertResponse;
}

const EmergencyEvacuation: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EvacuationAlert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpQuery, setHelpQuery] = useState('');
  const [querySubmitted, setQuerySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        // Fetch alerts and user's responses
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: responsesData, error: responsesError } = await supabase
          .from('alert_responses')
          .select('*')
          .eq('user_id', user.id);

        if (alertsError || responsesError) {
          setError('Failed to fetch alerts data. Please try again later.');
          return;
        }

        const userResponses = new Map(responsesData.map(r => [r.alert_id, r.response]));
        const enrichedAlerts = alertsData.map(alert => ({
          ...alert,
          responded: userResponses.has(alert.id),
          response: userResponses.get(alert.id),
        }));
        setAlerts(enrichedAlerts);

        // Fetch shelters
        const { data: sheltersData, error: sheltersError } = await supabase
          .from('shelters')
          .select('*');
        
        if (sheltersError) {
          setError('Failed to fetch shelters data. Please try again later.');
          return;
        }

        setShelters(sheltersData);
      } catch (err: any) {
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Real-time subscription for new alerts
    const channel = supabase.channel('realtime alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const newAlert = payload.new as Alert;
        setAlerts(prev => [{ ...newAlert, responded: false }, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAlertResponse = async (alertId: string, response: AlertResponse) => {
    if (!user) return;

    // Optimistically update UI
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, responded: true, response }
          : alert
      )
    );

    // Send to database
    const { error } = await supabase.from('alert_responses').insert({
      alert_id: alertId,
      user_id: user.id,
      response: response,
    });

    if (error) {
      setError('Failed to submit response. Please try again.');
      // Revert UI on error
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, responded: false, response: undefined }
            : alert
        )
      );
    }
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (helpQuery.trim()) {
      // In a real app, this would submit to a 'queries' table.
      setQuerySubmitted(true);
      setHelpQuery('');
      setTimeout(() => setQuerySubmitted(false), 3000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-blue-400 bg-blue-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'high': return 'border-orange-400 bg-orange-50';
      case 'critical': return 'border-red-400 bg-red-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return '📢';
      case 'medium': return '⚠️';
      case 'high': return '🔶';
      case 'critical': return '🚨';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Emergency Evacuation</h1>
        <div className="flex items-center">
          <a
            href="tel:112"
            className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors"
          >
            <Phone className="h-4 w-4 mr-1.5 sm:mr-2" />
            Emergency: 112
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Active Evacuation Alerts</h2>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-center text-sm sm:text-base text-gray-500 py-6 sm:py-8">No active alerts at the moment.</p>
                ) : (
                  alerts.map(alert => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 sm:p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center">
                          <span className="text-lg sm:text-xl mr-1.5 sm:mr-2">{getSeverityIcon(alert.severity)}</span>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900">{alert.title}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">{alert.severity} Alert</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(alert.created_at), 'HH:mm')}
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">{alert.message}</p>
                      
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {alert.location}
                      </div>

                      {!alert.responded ? (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <button
                            onClick={() => handleAlertResponse(alert.id, 'yes')}
                            className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Evacuated / Safe
                          </button>
                          <button
                            onClick={() => handleAlertResponse(alert.id, 'no')}
                            className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Need Help
                          </button>
                        </div>
                      ) : (
                        <div className={`p-2 sm:p-3 rounded-lg ${
                          alert.response === 'yes' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <p className="text-xs sm:text-sm font-medium">
                            {alert.response === 'yes' 
                              ? '✓ You marked yourself as safe/evacuated' 
                              : '⚠️ Help request sent to authorities'
                            }
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Help & Query Portal</h2>
            {querySubmitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 sm:py-8">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-green-600 font-medium">Query submitted successfully!</p>
                <p className="text-xs sm:text-sm text-gray-600">Emergency response team will contact you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleQuerySubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="query" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Describe your situation or ask for help
                  </label>
                  <textarea
                    id="query"
                    rows={4}
                    value={helpQuery}
                    onChange={(e) => setHelpQuery(e.target.value)}
                    placeholder="Example: Need immediate evacuation assistance for elderly family member..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Submit Emergency Query
                </button>
              </form>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Nearby Safe Shelters</h2>
            <div className="space-y-3 sm:space-y-4">
              {shelters.map(shelter => (
                <div key={shelter.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-sm sm:text-base text-gray-900">{shelter.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{shelter.address}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      shelter.capacity > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {shelter.capacity}% Available
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">{shelter.distance}km away</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shelter.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyEvacuation;
