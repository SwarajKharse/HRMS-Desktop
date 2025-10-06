import React from 'react';
import { usePermissions } from '../contexts/PermissionsContext';
import { Navigate } from 'react-router-dom';

const ProtectedPermissionRoute = ({ permissionKey, children }) => {
  const { permissions, loading } = usePermissions();

  // While loading, you may show a spinner or nothing
  if (loading) {
    return <div>Loading...</div>;
  }

  // If permissions are loaded but the required permission is not granted, redirect to no access.
  if (!permissions || !permissions[permissionKey]) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedPermissionRoute;