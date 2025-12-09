import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useNavyFederal } from '../Context/NavyFederalContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    currentUser, 
    userRole 
  } = useNavyFederal();
  
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Handle role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page or home depending on your requirements
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location.pathname,
          requiredRoles: allowedRoles 
        }} 
        replace 
      />
    );
  }

  // Render protected content if all checks pass
  return children;
};

export default ProtectedRoute;