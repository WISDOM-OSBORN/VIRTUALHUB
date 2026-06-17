
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ResearcherPortfolio from './pages/ResearcherPortfolio';
import Dashboards from './pages/Dashboards';
import { Onboarding } from './pages/Onboarding';
import Products from './pages/Products';
import News from './pages/News';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import { UserRole, User } from './types';
import { AdminLogin } from './pages/AdminLogin';
import { AlertCircle, X, CheckCircle2, BellRing } from 'lucide-react';
import { supabase } from './lib/supabase';
import { StorageService } from './services/storageService';
import { AIScoutService } from './services/aiScoutService';

// --- TOAST SYSTEM ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => (
  <div className="fixed top-24 right-6 z-[200] space-y-3 pointer-events-none">
    {toasts.map((toast) => (
      <div 
        key={toast.id} 
        className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-fade-in-right max-w-sm ${
          toast.type === 'success' ? 'bg-ug-navy border-ug-teal text-white' : 
          toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 
          'bg-white border-gray-100 text-ug-navy'
        }`}
      >
        {toast.type === 'success' ? <CheckCircle2 className="text-ug-teal shrink-0" size={20} /> : <AlertCircle size={20} className="shrink-0" />}
        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 p-1 hover:bg-white/10 rounded-full transition">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  isAuthenticated: boolean; 
  children: React.ReactNode;
  onUnauthorized: () => void;
}> = ({ isAuthenticated, children, onUnauthorized }) => {
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname === '/dashboard') {
      onUnauthorized();
    }
  }, [isAuthenticated, location.pathname, onUnauthorized]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        loadProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        loadProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global news sync trigger (runs on app load + every 12 hours)
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await StorageService.testConnection();
      if (!isConnected) {
        showToast("Database Connection Error: Please check your Supabase settings.", "error");
      }
    };

    const triggerSync = () => {
      AIScoutService.autoSyncNews().then(didUpdate => {
        if (didUpdate) {
          console.log("Global Sync: News Feed Updated Automatically.");
        }
      }).catch(err => {
        console.error("Auto Sync Failed:", err);
      });
    };

    checkConnection();
    triggerSync();
    const interval = setInterval(triggerSync, 12 * 60 * 60 * 1000); // 12 Hours
    return () => clearInterval(interval);
  }, []);

  // Periodic unread count check (every 30 seconds or on route change)
  useEffect(() => {
    if (isAuthenticated && userProfile?.id) {
      const fetchCount = async () => {
        const count = await StorageService.getUnreadCount(userProfile.id);
        setUnreadCount(count);
      };
      fetchCount();
      
      // Setup interval for live updates
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userProfile?.id, location.pathname]);

  const loadProfile = async (userId: string) => {
    const profile = await StorageService.getProfile(userId);
    if (profile) {
      setUserProfile(profile);
    } else {
      setUserProfile({ id: userId, email: '', name: 'Researcher', role: UserRole.Researcher });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setUnreadCount(0);
    showToast("Session Secured & Terminated", "info");
    navigate('/');
  };

  const handleUserIconClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleUnauthorizedAccess = () => {
    setShowLoginPrompt(true);
    setIsAuthModalOpen(true);
  };

  const handleSelectMessage = (threadId: string) => {
    setSelectedThreadId(threadId);
    navigate('/dashboard');
  };

  const isDashboard = location.pathname === '/dashboard';
  const isAdminLogin = location.pathname === '/admin/login';
  const hideLayout = isDashboard || isAdminLogin;

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="flex flex-col min-h-screen font-sans text-gray-900">
        {!hideLayout && (
          <Navbar 
              isAuthenticated={isAuthenticated}
              user={userProfile}
              onUserIconClick={handleUserIconClick}
              onLogout={handleLogout}
              onSelectMessage={handleSelectMessage}
              unreadCount={unreadCount}
          />
        )}
        
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        {showLoginPrompt && !isAuthenticated && (
          <div className="bg-ug-warning/90 backdrop-blur-sm text-ug-navy py-3 px-4 flex items-center justify-center gap-3 animate-fade-in shadow-xl relative z-40 border-b border-ug-warning">
            <BellRing size={20} className="shrink-0 animate-bounce" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
              Identity Required: Please sign in to access secure researcher tools.
            </span>
            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="ml-4 p-1 hover:bg-black/10 rounded-full transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/researcher/:id" element={<ResearcherPortfolio />} />
            <Route path="/products" element={<Products />} />
            <Route path="/news" element={<News />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute 
                    isAuthenticated={isAuthenticated} 
                    onUnauthorized={handleUnauthorizedAccess}
                  >
                    {userProfile?.role !== UserRole.Admin && !userProfile?.ai_profile && !localStorage.getItem(`onboarding_skipped_${userProfile?.id}`) ? (
                      <Onboarding 
                        user={userProfile} 
                        onComplete={() => userProfile && loadProfile(userProfile.id)} 
                        onSkip={() => {
                          if (userProfile?.id) {
                            localStorage.setItem(`onboarding_skipped_${userProfile.id}`, 'true');
                            loadProfile(userProfile.id);
                          }
                        }}
                      />
                    ) : (
                      <Dashboards 
                        role={userProfile?.role || UserRole.Researcher} 
                        user={userProfile} 
                        initialThreadId={selectedThreadId}
                        onThreadHandled={() => setSelectedThreadId(null)}
                        onLogout={handleLogout}
                        onProfileUpdate={() => userProfile && loadProfile(userProfile.id)}
                      />
                    )}
                  </ProtectedRoute>
                } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)}
        />

        {!hideLayout && <AIAssistant />}
        {!hideLayout && <Footer />}
      </div>
    </ToastContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
