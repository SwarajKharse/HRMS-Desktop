import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import PrivateRoute from './components/PrivateRoute';

import ProtectedPermissionRoute from './components/ProtectedPermissionRoute';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import LeaveTracker from './pages/LeaveTracker';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';

import EmployeeProfile from './components/EmployeeProfile';

import Settings from './pages/Settings';
import OrganizationSettings from './pages/settings/OrganizationSettings';
import RoleBasedSettings from './pages/settings/RoleBasedSettings';
import LeaveSettings from './pages/settings/LeaveSettings';
import AttendanceSettings from './pages/settings/AttendanceSettings';
import HolidaySettings from './pages/settings/HolidaySettings';
import GeoFencingSettings from './pages/settings/GeoFencingSettings';
import TdsSlabSettings from './pages/settings/TdsSlabSettings';
import EmployeePayrollSettings from './pages/settings/EmployeePayrollSettings';
import OrganizationPayrollSettings from './pages/settings/OrganizationPayrollSettings';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <PermissionsProvider>
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
              <Route path="/reports" element={
                <ProtectedPermissionRoute permissionKey="webReports">
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedPermissionRoute permissionKey='webOnboarding'>
                  <Layout>
                    <Onboarding />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              <Route path="/onboarding/employee/:hash" element={
                <ProtectedPermissionRoute permissionKey='webOnboarding'>
                  <Layout>
                    <EmployeeProfile />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              <Route path="/leave-tracker" element={
                <ProtectedPermissionRoute permissionKey="webLeave">
                  <Layout>
                    <LeaveTracker />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedPermissionRoute permissionKey="webAttendance">
                  <Layout>
                    <Attendance />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              <Route path="/payroll" element={
                <ProtectedPermissionRoute permissionKey="webPayroll">
                  <Layout>
                    <Payroll />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route
                path="/settings/organization"
                element={
                  <ProtectedPermissionRoute permissionKey="webSettings">
                    <Layout>
                      <OrganizationSettings />
                    </Layout>
                  </ProtectedPermissionRoute>
                }
              />

              <Route path="/settings/rbac" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <RoleBasedSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/leave" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <LeaveSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/attendance-settings" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <AttendanceSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />
              
              <Route path="/settings/holiday" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <HolidaySettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/geoFencing" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <GeoFencingSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/tds-slabs" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <TdsSlabSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/employee-payroll-settings" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <EmployeePayrollSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              <Route path="/settings/organization-payroll-settings" element={
                <ProtectedPermissionRoute permissionKey="webSettings">
                  <Layout>
                    <OrganizationPayrollSettings />
                  </Layout>
                </ProtectedPermissionRoute>
              } />

              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PermissionsProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;