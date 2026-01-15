import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './pages/Login';
import ApplicationForm from './pages/ApplicationForm';
import Summary from './pages/Summary';
import AdminDashboard from './pages/AdminDashboard';
import { NAV_ITEMS, APP_NAME } from './constants';
import { LogOut, Menu, X, Printer, UserCircle } from 'lucide-react';
import { MockService } from './services/mockDb';

// --- Layout Component ---
const Layout: React.FC<{ user: User | null; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ adminCount: 0, workerCount: 0 });

  // Poll for notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchCounts = () => {
      MockService.getNotificationCounts(user).then(setCounts);
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [user, location.pathname]); // Update when user changes or route changes (likely action taken)

  if (!user) return <>{children}</>;

  const getBadge = (path: string) => {
    if (path === '/admin' && counts.adminCount > 0) {
      return (
        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {counts.adminCount}
        </span>
      );
    }
    if (path === '/summary' && counts.workerCount > 0) {
      return (
        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {counts.workerCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-brand-900 text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="font-bold text-xl tracking-tight flex items-center gap-2">
                <Printer className="h-6 w-6" />
                {APP_NAME}
              </span>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    location.pathname === item.path
                      ? 'bg-brand-800 text-white'
                      : 'text-brand-100 hover:bg-brand-700'
                  }`}
                >
                  {item.label}
                  {getBadge(item.path)}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <div className="flex flex-col items-end text-sm">
                <span className="font-semibold">{user.name}</span>
                <span className="text-brand-200 text-xs">{user.workstation}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-brand-700 transition-colors"
                title="登出"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-brand-200 hover:text-white hover:bg-brand-700"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-brand-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex justify-between items-center ${
                    location.pathname === item.path
                      ? 'bg-brand-900 text-white'
                      : 'text-brand-100 hover:bg-brand-700'
                  }`}
                >
                  {item.label}
                  {getBadge(item.path)}
                </Link>
              ))}
              <div className="border-t border-brand-700 mt-4 pt-4 px-3 flex items-center justify-between text-brand-100">
                <div className="flex items-center gap-2">
                   <UserCircle className="h-8 w-8" />
                   <div>
                     <div className="font-medium text-white">{user.name}</div>
                     <div className="text-xs">{user.workstation}</div>
                   </div>
                </div>
                <button onClick={onLogout} className="text-sm font-medium hover:text-white">
                  登出
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {APP_NAME}. 關鍵構件一次合格獎金系統
        </div>
      </footer>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('weldtrack_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('weldtrack_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('weldtrack_user');
  };

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <ApplicationForm user={user} /> : <Navigate to="/login" />} />
          <Route path="/summary" element={user ? <Summary user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === UserRole.ADMIN ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;