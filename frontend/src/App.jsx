import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import BrandDashboard from './pages/BrandDashboard';
import CampaignCreator from './pages/CampaignCreator';
import CampaignSimulator from './pages/CampaignSimulator';
import DiscoveryHub from './pages/DiscoveryHub';
import InfluencerDashboard from './pages/InfluencerDashboard';
import Marketplace from './pages/Marketplace';
import { api } from './services/api';

// Authentication Guard Component
const ProtectedRoute = ({ children, allowedRole }) => {
  if (!api.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRole && api.getRole() !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Root Router Redirector
const RootRedirector = () => {
  if (!api.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return api.getRole() === 'brand' 
    ? <Navigate to="/brand/dashboard" replace /> 
    : <Navigate to="/influencer/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-white flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RootRedirector />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Brand Routes */}
            <Route 
              path="/brand/dashboard" 
              element={
                <ProtectedRoute allowedRole="brand">
                  <BrandDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/brand/create-campaign" 
              element={
                <ProtectedRoute allowedRole="brand">
                  <CampaignCreator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/brand/simulate/:campaignId" 
              element={
                <ProtectedRoute allowedRole="brand">
                  <CampaignSimulator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/brand/discover" 
              element={
                <ProtectedRoute allowedRole="brand">
                  <DiscoveryHub />
                </ProtectedRoute>
              } 
            />
            
            {/* Influencer Routes */}
            <Route 
              path="/influencer/dashboard" 
              element={
                <ProtectedRoute allowedRole="influencer">
                  <InfluencerDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Common Routes */}
            <Route 
              path="/marketplace" 
              element={
                <ProtectedRoute>
                  <Marketplace />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
