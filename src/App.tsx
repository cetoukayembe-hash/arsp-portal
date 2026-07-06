import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { RegistrationRequest } from './pages/RegistrationRequest';
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
import { VerifyCard } from './pages/VerifyCard';
import { AuditLog } from './pages/AuditLog';

export interface AuthContextType {
  userSector?: string;
  userProvince?: string;
  userCity?: string;
  isAuthenticated: boolean;
  userRole: 'subcontractor' | 'prime' | 'admin';
  userStatus: 'pending' | 'active' | 'rejected' | 'suspended';
  userEmail: string;
  userId: string;
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
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-0'}`}>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center card-shadow">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-[#0a2540] mb-2">Compte en attente</h2>
        <p className="text-gray-500 mb-4">
          Votre demande d'enregistrement est en cours de verification par l'equipe ARSP. 
          Vous recevrez un email lorsque votre compte sera approuve.
        </p>
        <p className="text-xs text-gray-400">
          Delai moyen: 24-48 heures ouvrables
        </p>
      </div>
    </div>
  );
}

function RejectedAccountPage({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center card-shadow">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-[#0a2540] mb-2">Demande rejetee</h2>
        <p className="text-gray-500 mb-4">
          Votre demande d'enregistrement a ete rejetee.
        </p>
        {reason && (
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700"><strong>Motif:</strong> {reason}</p>
          </div>
        )}
        <p className="text-xs text-gray-400">
          Contactez ARSP pour plus d'informations.
        </p>
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

  // Admins are always active, regardless of database status
  const effectiveStatus = auth.userRole === 'admin' ? 'active' : auth.userStatus;

  if (effectiveStatus === 'pending') {
    return <PendingApprovalPage />;
  }

  if (effectiveStatus === 'rejected') {
    return <RejectedAccountPage />;
  }

  if (effectiveStatus === 'suspended') {
    return <RejectedAccountPage reason="Compte suspendu" />;
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
      <Route path="/register" element={<RegistrationRequest />} />
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
      <Route path="/verify/:arspId" element={<VerifyCard />} />
      <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
    </Routes>
    
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'subcontractor' | 'prime' | 'admin'>('subcontractor');
  const [userStatus, setUserStatus] = useState<'pending' | 'active' | 'rejected' | 'suspended'>('pending');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userSector, setUserSector] = useState('');
  const [userProvince, setUserProvince] = useState('');
  const [userCity, setUserCity] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(userId: string, email: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, status, sector, province, city')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Profile load error:', error);
      setLoading(false);
      return;
    }
    
    if (data) {
      setUserRole(data.role as 'subcontractor' | 'prime' | 'admin');
      setUserSector(data.sector || '');
      setUserProvince(data.province || '');
      setUserCity(data.city || '');
      // Admins are always active, regardless of database status
      const isAdmin = data.role === 'admin';
      const newStatus = isAdmin ? 'active' : (data.status || 'pending');
      setUserStatus(newStatus as 'pending' | 'active' | 'rejected' | 'suspended');
    } else {
      // No profile found — default to pending
      setUserStatus('pending');
    }
    
    setUserEmail(email);
    setUserId(userId);
    setIsAuthenticated(true);
    setLoading(false);
    
    // Log successful login
    import('./lib/audit').then(({ logAudit }) => {
      logAudit('LOGIN', 'user_profiles', userId);
    });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile(session.user.id, session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
        setUserId('');
        setUserRole('subcontractor');
        setUserStatus('pending');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const currentUserId = userId;
    if (currentUserId) {
      import('./lib/audit').then(({ logAudit }) => {
        logAudit('LOGOUT', 'user_profiles', currentUserId);
      });
    }
    
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
    setUserId('');
    setUserRole('subcontractor');
    setUserStatus('pending');
  };

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }
  }, []);


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
    <AuthContext.Provider value={{ isAuthenticated, userRole, userStatus, userEmail, userId, userSector, userProvince, userCity, logout }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}