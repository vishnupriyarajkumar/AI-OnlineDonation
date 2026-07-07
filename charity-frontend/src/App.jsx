import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

// Public Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyAccount from './pages/auth/VerifyAccount';
import ForgotPassword from './pages/auth/ForgotPassword';
import Campaigns from './pages/public/Campaigns';
import CampaignDetails from './pages/public/CampaignDetails';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Unauthorized from './pages/public/Unauthorized';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import MyDonations from './pages/user/MyDonations';
import DonationFlow from './pages/user/DonationFlow';
import Profile from './pages/user/Profile';
import SubscriptionOnboarding from './pages/user/SubscriptionOnboarding';
import SubscriptionManagement from './pages/user/SubscriptionManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCampaigns from './pages/admin/ManageCampaigns';
import CampaignForm from './pages/admin/CampaignForm';
import ManageDonations from './pages/admin/ManageDonations';
import AuditLogs from './pages/admin/AuditLogs';
import ActivityLogs from './pages/admin/ActivityLogs';
import FundAllocation from './pages/admin/FundAllocation';
import Reports from './pages/admin/Reports';

import Chatbot from './components/Chatbot';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Chatbot />
          <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-account" element={<VerifyAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* User */}
          <Route path="/user" element={<ProtectedRoute roles={['USER']}><UserDashboard /></ProtectedRoute>} />
          <Route path="/user/donate/:id" element={<ProtectedRoute roles={['USER','ADMIN']}><DonationFlow /></ProtectedRoute>} />
          <Route path="/user/donations" element={<ProtectedRoute roles={['USER']}><MyDonations /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute roles={['USER']}><Profile /></ProtectedRoute>} />
          <Route path="/user/subscription" element={<ProtectedRoute roles={['USER']}><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute roles={['USER']}><SubscriptionOnboarding /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/campaigns" element={<ProtectedRoute roles={['ADMIN']}><ManageCampaigns /></ProtectedRoute>} />
          <Route path="/admin/campaigns/new" element={<ProtectedRoute roles={['ADMIN']}><CampaignForm /></ProtectedRoute>} />
          <Route path="/admin/campaigns/edit/:id" element={<ProtectedRoute roles={['ADMIN']}><CampaignForm /></ProtectedRoute>} />
          <Route path="/admin/donations" element={<ProtectedRoute roles={['ADMIN']}><ManageDonations /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/activities" element={<ProtectedRoute roles={['ADMIN']}><ActivityLogs /></ProtectedRoute>} />
          <Route path="/admin/fund-allocation" element={<ProtectedRoute roles={['ADMIN']}><FundAllocation /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><Reports /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
