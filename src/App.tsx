import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { RegistrationWizard } from './pages/RegistrationWizard';
import { DigitalID } from './pages/DigitalID';
import { EnterpriseSearch } from './pages/EnterpriseSearch';
import { TenderOpportunities } from './pages/TenderOpportunities';
import { ComplianceDashboard } from './pages/ComplianceDashboard';
import { SmartMatching } from './pages/SmartMatching';
import { Messages } from './pages/Messages';
import { Analytics } from './pages/Analytics';
import { Contracts } from './pages/Contracts';
import { Payments } from './pages/Payments';
import { ESignature } from './pages/ESignature';
import { DisputeResolution } from './pages/DisputeResolution';
import { Approvals } from './pages/Approvals';
import { supabase } from './lib/supabase';
import { Declarations } from './pages/Declarations';
import { Dashboard } from './pages/Dashboard';

export interface AuthContextType {
  isAuthenticated: boolean;
  userRole: 'subcontractor' | 'prime' | 'admin';
  userEmail: string;
  userId: string;
  login: (role: 'subcontractor' | 'prime' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(auth.userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ProtectedRoute><RegistrationWizard /></ProtectedRoute>} />
      <Route path="/digital-id" element={<ProtectedRoute><DigitalID /></ProtectedRoute>} />
      <Route path="/enterprise-search" element={<EnterpriseSearch />} />
      <Route path="/tenders" element={<ProtectedRoute><TenderOpportunities /></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
      <Route path="/matching" element={<ProtectedRoute><SmartMatching /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['prime', 'admin']}><Payments /></ProtectedRoute>} />
      <Route path="/esignature" element={<ProtectedRoute><ESignature /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><DisputeResolution /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute allowedRoles={['admin']}><Approvals /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/declarations" element={<ProtectedRoute allowedRoles={['prime', 'admin']}><Declarations /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'subcontractor' | 'prime' | 'admin'>('subcontractor');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(userId: string, email: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (data) {
      setUserRole(data.role as 'subcontractor' | 'prime' | 'admin');
    }
    setUserEmail(email);
    setUserId(userId);
    setIsAuthenticated(true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
        setUserId('');
        setUserRole('subcontractor');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (role: 'subcontractor' | 'prime' | 'admin') => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setUserId('');
    setUserRole('subcontractor');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#007FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userEmail, userId, login, logout }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}