import React from 'react';
import { Loader2, Shield } from 'lucide-react';

export const FullPageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="h-8 w-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900">DisasterGuard</span>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-4 text-gray-600">Loading Application...</p>
    </div>
  );
};
