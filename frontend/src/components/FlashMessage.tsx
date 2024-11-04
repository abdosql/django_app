import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface FlashMessageProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function FlashMessage({ message, type, onClose }: FlashMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 w-96 z-50 ${type === 'success' ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-md shadow-lg`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success'
                  ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                  : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 