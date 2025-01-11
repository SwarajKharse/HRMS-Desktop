import React, { useState, useEffect }  from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Login from './pages/Login';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import LeaveTracker from './pages/LeaveTracker';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
// import TimeTracker from './pages/TimeTracker';
// import Operations from './pages/Operations';
// import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/leave-tracker" element={<LeaveTracker />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payroll" element={<Payroll />} />
          {/* <Route path="/time-tracker" element={<TimeTracker />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/reports" element={<Reports />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

// import React, { useState, useEffect }  from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Layout from './components/Layout';

// import Login from './pages/Login';
// import Home from './pages/Home';
// import Onboarding from './pages/Onboarding';
// import LeaveTracker from './pages/LeaveTracker';
// import Attendance from './pages/Attendance';
// import Payroll from './pages/Payroll';
// // import TimeTracker from './pages/TimeTracker';
// // import Operations from './pages/Operations';
// // import Reports from './pages/Reports';

// import PrivateRoute from './components/PrivateRoute';
// import { authService } from './services/authService';
// import axios from 'axios';

// function App() {

//   useEffect(() => {
//     // Add axios interceptor for JWT token
//     const interceptor = axios.interceptors.request.use(
//       (config) => {
//         const token = authService.getToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     return () => {
//       axios.interceptors.request.eject(interceptor);
//     };
//   }, []);


//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={
//           authService.isAuthenticated() ? <Navigate to="/" replace /> : <Login />
//         } />
        
//         {/* Protected Routes */}
//         <Route path="/" element={
//           <PrivateRoute>
//             <Layout>
//               <Home />
//             </Layout>
//           </PrivateRoute>
//         } />
//         <Route path="/onboarding" element={
//           <PrivateRoute>
//             <Layout>
//               <Onboarding />
//             </Layout>
//           </PrivateRoute>
//         } />
//         <Route path="/leave-tracker" element={
//           <PrivateRoute>
//             <Layout>
//               <LeaveTracker />
//             </Layout>
//           </PrivateRoute>
//         } />
//         <Route path="/attendance" element={
//           <PrivateRoute>
//             <Layout>
//               <Attendance />
//             </Layout>
//           </PrivateRoute>
//         } />
//         {/* <Route path="/time-tracker" element={
//           <PrivateRoute>
//             <Layout>
//               <TimeTracker />
//             </Layout>
//           </PrivateRoute>
//         } />
//         <Route path="/operations" element={
//           <PrivateRoute>
//             <Layout>
//               <Operations />
//             </Layout>
//           </PrivateRoute>
//         } />
//         <Route path="/reports" element={
//           <PrivateRoute>
//             <Layout>
//               <Reports />
//             </Layout>
//           </PrivateRoute>
//         } /> */}
//         <Route path="/payroll" element={
//           <PrivateRoute>
//             <Layout>
//               <Payroll />
//             </Layout>
//           </PrivateRoute>
//         } />

//         {/* Redirect any unknown routes to home */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;