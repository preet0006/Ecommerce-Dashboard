import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredToken } from '../../lib/api';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
