import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import OperatorSettings from './pages/OperatorSettings';
import SystemSettings from './pages/SystemSettings';
import IncidentDetails from './pages/IncidentDetails';
import Incidents from './pages/Incidents';
import ExportData from './pages/ExportData';
import DeviceManagement from './pages/DeviceManagement';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <Navbar />
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/profile" element={<MyProfile />} />
                      <Route path="/operator-settings" element={<OperatorSettings />} />
                      <Route path="/incidents/:id" element={<IncidentDetails />} />
                      <Route path="/incidents" element={<Incidents />} />
                      <Route path="/export" element={<ExportData />} />
                      <Route path="/system-settings" element={
                        <AdminRoute>
                          <SystemSettings />
                        </AdminRoute>
                      } />
                      <Route path="/devices" element={
                        <AdminRoute>
                          <DeviceManagement />
                        </AdminRoute>
                      } />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;