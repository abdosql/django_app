import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FlashMessage from '../components/FlashMessage';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_staff: boolean;
  operator_id?: number;
  operator_priority?: number;
}

interface FlashState {
  message: string;
  type: 'success' | 'error';
}

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const userId = sessionStorage.getItem('user_id');

        if (!userId) {
          throw new Error('User ID not found');
        }

        const response = await fetch(`/api/auth/users/${userId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');

      if (!userId) {
        throw new Error('User ID not found');
      }

      const updateData = {
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        is_operator: profile.operator_id ? true : false,
      };

      const response = await fetch(`/api/auth/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setFlash({
        type: 'success',
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Flash Message */}
      {flash && (
        <FlashMessage
          message={flash.message}
          type={flash.type}
          onClose={() => setFlash(null)}
        />
      )}
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account information and settings</p>
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-10 w-10 text-indigo-600" />
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">
              {profile?.is_staff ? 'Admin Operator' : profile?.operator_id ? `Operator (Priority ${profile.operator_priority})` : 'Viewer'}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                  onChange={(e) => {
                    const [first, ...rest] = e.target.value.split(' ');
                    setProfile(prev => prev ? {
                      ...prev,
                      first_name: first,
                      last_name: rest.join(' ')
                    } : null);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="email"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={profile?.email || ''}
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <div className="mt-1 flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="tel"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={profile?.phone || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="mt-1 flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={profile?.is_staff ? 'Admin Operator' : profile?.operator_id ? `Operator (Priority ${profile.operator_priority})` : 'Viewer'}
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Join Date</label>
              <div className="mt-1 flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={profile?.join_date || 'N/A'}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 