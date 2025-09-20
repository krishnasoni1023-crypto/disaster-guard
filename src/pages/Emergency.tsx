import React, { useState, useEffect } from 'react';
import { Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: string;
  location: string;
}

const Emergency: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;

      setContacts(data || []);
    } catch (err: any) {
      console.error('Error fetching emergency contacts:', err);
      setError('Failed to load emergency contacts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || contact.type === selectedType;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = ['all', ...new Set(contacts.map(contact => contact.type))];

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quick access to emergency services and helpline numbers.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map(contact => (
          <div
            key={contact.id}
            className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{contact.location}</p>
                <p className="mt-1 text-xs font-medium text-blue-600 uppercase">{contact.type}</p>
              </div>
              <button
                onClick={() => handleCall(contact.phone)}
                className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
              >
                <Phone className="h-5 w-5 text-green-600" />
              </button>
            </div>
            <div className="mt-3">
              <a
                href={`tel:${contact.phone}`}
                className="text-lg font-medium text-gray-900 hover:text-blue-600"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No emergency contacts found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Emergency;