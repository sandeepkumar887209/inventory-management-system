import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIdentity } from '../../context/IdentityContext';

export default function RequireAdmin() {
  const { user, isAdmin, loading } = useIdentity();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    // Redirect non-admins to dashboard
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
