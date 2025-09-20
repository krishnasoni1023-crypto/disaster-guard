import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Users, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalReports: number;
  activeAlerts: number;
  communityMembers: number;
  recentActivities: number;
}

interface RecentReport {
  id: string;
  type: string;
  location: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved';
}

const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    activeAlerts: 0,
    communityMembers: 0,
    recentActivities: 0
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats from Supabase
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*');

      if (reportsError) throw reportsError;

      // Fetch recent reports
      const { data: recentReportsData, error: recentError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Transform recent reports data
      const transformedReports = recentReportsData?.map(report => ({
        id: report.id,
        type: report.type,
        location: report.location,
        timestamp: new Date(report.created_at).toLocaleDateString(),
        status: report.status
      })) || [];

      // Update stats
      setStats({
        totalReports: reportsData?.length || 0,
        activeAlerts: reportsData?.filter(r => r.status !== 'resolved').length || 0,
        communityMembers: 150, // Mock data
        recentActivities: 24 // Mock data
      });

      setRecentReports(transformedReports);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: AlertTriangle,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: Activity,
      color: 'bg-red-500'
    },
    {
      title: 'Community Members',
      value: stats.communityMembers,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Recent Activities',
      value: stats.recentActivities,
      icon: Activity,
      color: 'bg-purple-500'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's an overview of disaster management activities.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">{stat.title}</h2>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Reports</h2>
          <Link
            to="/report"
            className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
          >
            View all reports
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentReports.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {report.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reports available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
