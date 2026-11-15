import { AnimatePresence, MotionConfig } from 'motion/react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AboutPage } from './pages/AboutPage';
import { AddInvestmentPage } from './pages/AddInvestmentPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { InvestorDashboardPage } from './pages/InvestorDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ManageInvestmentsPage } from './pages/ManageInvestmentsPage';
import { PortfolioAllocationPage } from './pages/PortfolioAllocationPage';
import { PortfolioOverviewPage } from './pages/PortfolioOverviewPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfitLossPage } from './pages/ProfitLossPage';
import { ReportsPage } from './pages/ReportsPage';
import { ServicesPage } from './pages/ServicesPage';
import { SignupPage } from './pages/SignupPage';
import { UserManagementPage } from './pages/UserManagementPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Investor Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <InvestorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investments/add"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <AddInvestmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investments"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <ManageInvestmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/overview"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <PortfolioOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit-loss"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <ProfitLossPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allocation"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <PortfolioAllocationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['investor']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Administrator Pages */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Authenticated Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['investor', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </MotionConfig>
  );
}
