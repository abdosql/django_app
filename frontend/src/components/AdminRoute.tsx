import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user?.isStaff) {
    // Redirect to home page if user is not an admin
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 