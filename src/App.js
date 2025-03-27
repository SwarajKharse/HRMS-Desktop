import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import { AuthProvider } from "./contexts/AuthContext"
import { NotificationsProvider } from "./contexts/NotificationsContext"
import { PermissionsProvider } from "./contexts/PermissionsContext"

import PrivateRoute from "./components/PrivateRoute"
import PublicRoute from "./components/PublicRoute"
import ProtectedPermissionRoute from "./components/ProtectedPermissionRoute"

import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Onboarding from "./pages/Onboarding"
import LeaveTracker from "./pages/LeaveTracker"
import Attendance from "./pages/Attendance"
import Payroll from "./pages/Payroll"
import Reports from "./pages/Reports"

import EmployeeProfile from "./components/EmployeeProfile"

import Settings from "./pages/Settings"
import OrganizationSettings from "./pages/settings/OrganizationSettings"
import RoleBasedSettings from "./pages/settings/RoleBasedSettings"
import LeaveSettings from "./pages/settings/LeaveSettings"
import AttendanceSettings from "./pages/settings/AttendanceSettings"
import HolidaySettings from "./pages/settings/HolidaySettings"
import GeoFencingSettings from "./pages/settings/GeoFencingSettings"
import TdsSlabSettings from "./pages/settings/TdsSlabSettings"
import EmployeePayrollSettings from "./pages/settings/EmployeePayrollSettings"
import OrganizationPayrollSettings from "./pages/settings/OrganizationPayrollSettings"

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <PermissionsProvider>
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    {" "}
                    <Login />{" "}
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    {" "}
                    <Register />{" "}
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Home />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webReports">
                      <Layout>
                        <Reports />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webOnboarding">
                      <Layout>
                        <Onboarding />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/onboarding/employee/:hash"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webOnboarding">
                      <Layout>
                        <EmployeeProfile />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/leave-tracker"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webLeave">
                      <Layout>
                        <LeaveTracker />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webAttendance">
                      <Layout>
                        <Attendance />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webPayroll">
                      <Layout>
                        <Payroll />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/organization"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <OrganizationSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/rbac"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <RoleBasedSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/leave"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <LeaveSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/attendance-settings"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <AttendanceSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/holiday"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <HolidaySettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/geoFencing"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <GeoFencingSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/tds-slabs"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <TdsSlabSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/employee-payroll-settings"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <EmployeePayrollSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              <Route
                path="/settings/organization-payroll-settings"
                element={
                  <PrivateRoute>
                    <ProtectedPermissionRoute permissionKey="webSettings">
                      <Layout>
                        <OrganizationPayrollSettings />
                      </Layout>
                    </ProtectedPermissionRoute>
                  </PrivateRoute>
                }
              />

              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PermissionsProvider>
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App;