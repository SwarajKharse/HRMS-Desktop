import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import PrivateRoute from './components/PrivateRoute';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import LeaveTracker from './pages/LeaveTracker';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';

import Settings from './pages/Settings';
import OrganizationSettings from './pages/settings/OrganizationSettings';
import LeaveTrackerSettings from './pages/settings/LeaveTrackerSettings';
import ShiftSettings from './pages/settings/ShiftSettings';
import AttendanceSettings from './pages/settings/AttendanceSettings';
import HolidaySettings from './pages/settings/HolidaySettings';

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

            <Route path="/settings" element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />

            <Route
              path="/settings/organization"
              element={
                <PrivateRoute>
                  <Layout>
                    <OrganizationSettings />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route path="/settings/leave-tracker" element={
              <PrivateRoute>
                <Layout>
                  <LeaveTrackerSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/attendance" element={
              <PrivateRoute>
                <Layout>
                  <AttendanceSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/shift" element={
              <PrivateRoute>
                <Layout>
                  <ShiftSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/holiday" element={
              <PrivateRoute>
                <Layout>
                  <HolidaySettings />
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