import {
  Briefcase,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PieChart,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserCircle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  title: string;
  breadcrumb: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  breadcrumb,
  actions,
  children,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const investorLinks: NavItem[] = [
    { to: '/dashboard', label: 'Investor Dashboard', icon: LayoutDashboard, end: true },
    { to: '/overview', label: 'Portfolio Overview', icon: Briefcase },
    { to: '/investments', label: 'Manage Investments', icon: FolderKanban, end: true },
    { to: '/investments/add', label: 'Add Investment', icon: PlusCircle },
    { to: '/profit-loss', label: 'Profit and Loss', icon: TrendingUp },
    { to: '/allocation', label: 'Portfolio Allocation', icon: PieChart },
    { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck, end: true },
    { to: '/admin/users', label: 'User Management', icon: UserCheck },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ];

  const navItems = user?.role === 'admin' ? adminLinks : investorLinks;

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  const renderNavLinks = (
    layoutGroupId: string,
    onNavigate?: () => void
  ) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={layoutGroupId}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-emerald-600 rounded-lg shadow-sm"
                  />
                )}
                <Icon className="relative z-10 w-4 h-4 shrink-0" />
                <span className="relative z-10 truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1F3A] text-white border-r border-[#132E53]">
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
          >
            PortfolioVault
          </Link>
        </div>

        <div className="px-5 py-3.5 border-b border-white/10 bg-[#091930]">
          <p className="text-xs text-slate-400">
            {user?.role === 'admin' ? 'Administrator Workspace' : 'Investor Workspace'}
          </p>
          <p className="text-sm font-semibold text-white truncate mt-0.5">
            {user?.fullName}
          </p>
        </div>

        {renderNavLinks('desktop-sidebar-pill')}

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Public Site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 shrink-0" />
            )}
            <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-slate-900/50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-72 max-w-[85vw] bg-[#0B1F3A] text-white flex flex-col z-10"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
                <span className="font-display text-lg font-bold text-white">
                  PortfolioVault
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-xs text-slate-400">
                  {user?.role === 'admin' ? 'Administrator' : 'Investor'}
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName}
                </p>
              </div>
              {renderNavLinks('mobile-sidebar-pill', () => setSidebarOpen(false))}
              <div className="p-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-60"
                >
                  {signingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
              <h1 className="font-display text-lg font-bold text-[#0B1F3A] truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 text-sm text-slate-700 hover:text-[#0B1F3A] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-slate-500" />
              <span className="max-w-[140px] truncate font-medium">
                {user?.fullName}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
