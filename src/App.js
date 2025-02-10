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
import Reports from './pages/Reports';

import Settings from './pages/Settings';
import OrganizationSettings from './pages/settings/OrganizationSettings';
import LeaveSettings from './pages/settings/LeaveSettings';
import AttendanceSettings from './pages/settings/AttendanceSettings';
import HolidaySettings from './pages/settings/HolidaySettings';
import GeoFencingSettings from './pages/settings/GeoFencingSettings';
import TdsSlabSettings from './pages/settings/TdsSlabSettings';
import EmployeePayrollSettings from './pages/settings/EmployeePayrollSettings';

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

            <Route path="/settings/leave" element={
              <PrivateRoute>
                <Layout>
                  <LeaveSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/attendance-settings" element={
              <PrivateRoute>
                <Layout>
                  <AttendanceSettings />
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

            <Route path="/settings/geoFencing" element={
              <PrivateRoute>
                <Layout>
                  <GeoFencingSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/tds-slabs" element={
              <PrivateRoute>
                <Layout>
                  <TdsSlabSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings/employee-payroll-settings" element={
              <PrivateRoute>
                <Layout>
                  <EmployeePayrollSettings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/reports" element={
              <PrivateRoute>
                <Layout>
                  <Reports />
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