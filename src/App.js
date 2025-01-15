import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import LeaveTracker from './pages/LeaveTracker';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout>
                  <Home />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/onboarding" element={
              <PrivateRoute>
                <Layout>
                  <Onboarding />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/leave-tracker" element={
              <PrivateRoute>
                <Layout>
                  <LeaveTracker />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/attendance" element={
              <PrivateRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/payroll" element={
              <PrivateRoute>
                <Layout>
                  <Payroll />
                </Layout>
              </PrivateRoute>
            } />

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;