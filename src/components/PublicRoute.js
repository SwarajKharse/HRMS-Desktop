import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!token);
    setAuthChecked(true);
  }, [token]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from || '/';
    return <Navigate to={destination} replace />;
  }

  return children;
}

export default PublicRoute;