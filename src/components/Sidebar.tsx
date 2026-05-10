import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ClipboardList, CreditCard, FileSignature, MessageSquare,
  Search, ShieldCheck, Briefcase, BarChart3, Zap, Gavel,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '@/App';

const navGroups = [
  {
    phase: 'MVP',
    color: 'bg-blue-500',
    roles: ['subcontractor', 'prime', 'admin'],
    items: [
      { to: '/register', label: 'Inscription', icon: ClipboardList, roles: ['subcontractor', 'prime'] },
      { to: '/digital-id', label: 'Carte Numerique', icon: CreditCard, roles: ['subcontractor', 'prime'] },
      { to: '/enterprise-search', label: 'Registre Entreprises', icon: Search, roles: ['subcontractor', 'prime', 'admin'] },
    ],
  },
  {
    phase: 'V2',
    color: 'bg-emerald-500',
    roles: ['subcontractor', 'prime', 'admin'],
    items: [
      { to: '/tenders', label: 'Appels d\'Offres', icon: Briefcase, roles: ['subcontractor', 'prime'] },
      { to: '/compliance', label: 'Conformité', icon: ShieldCheck, roles: ['subcontractor', 'admin'] },
    ],
  },
  {
    phase: 'V3',
    color: 'bg-violet-500',
    roles: ['subcontractor', 'prime', 'admin'],
    items: [
      { to: '/matching', label: 'Matching Intelligent', icon: Zap, roles: ['subcontractor', 'prime'] },
      { to: '/messages', label: 'Messagerie', icon: MessageSquare, roles: ['subcontractor', 'prime', 'admin'] },
      { to: '/contracts', label: 'Contrats', icon: FileSignature, roles: ['subcontractor', 'prime', 'admin'] },
      { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
    ],
  },
  {
    phase: 'V4',
    color: 'bg-amber-500',
    roles: ['subcontractor', 'prime', 'admin'],
    items: [
      { to: '/payments', label: 'Paiements', icon: CreditCard, roles: ['prime', 'admin'] },
      { to: '/esignature', label: 'E-Signature', icon: FileSignature, roles: ['subcontractor', 'prime'] },
      { to: '/disputes', label: 'Litiges', icon: Gavel, roles: ['subcontractor', 'prime', 'admin'] },
    ],
  },
];
export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const auth = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderNav = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/arsp-logo.jpg" alt="ARSP" className="w-10 h-10 rounded-full object-cover" />
          <div className={`${open || mobileOpen ? 'block' : 'hidden'}`}>
            <div className="font-bold text-sm text-[#0a2540]">ARSP</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Portail Numérique</div>
          </div>
        </div>
        <button
          onClick={() => { setOpen(!open); setMobileOpen(false); }}
          className="hidden lg:block p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          {open ? <ChevronLeft className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.phase}>
            <div className={`flex items-center gap-2 mb-2 px-2 ${(open || mobileOpen) ? '' : 'justify-center'}`}>
              <span className={`w-2 h-2 rounded-full ${group.color}`} />
              {(open || mobileOpen) && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Phase {group.phase}</span>
              )}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const requiresAuth = item.to !== '/enterprise-search';
                if (!auth.isAuthenticated) return null;
                if (!item.roles.includes(auth.userRole)) return null;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-[#0a2540] text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-[#0a2540]'
                      } ${(open || mobileOpen) ? '' : 'justify-center'}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {(open || mobileOpen) && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className={`p-4 border-t border-gray-200 ${(open || mobileOpen) ? '' : 'flex justify-center'}`}>
        <div className={`flex items-center gap-3 ${(open || mobileOpen) ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold">
            U
          </div>
          {(open || mobileOpen) && (
            <div>
              <div className="text-sm font-medium text-[#0a2540]">Utilisateur</div>
              <div className="text-xs text-gray-500 capitalize">{auth.userRole}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden p-2 bg-white rounded-md shadow-md"
      >
        <Menu className="w-5 h-5 text-[#0a2540]" />
      </button>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col ${
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        } ${open ? 'lg:w-[280px]' : 'lg:w-[72px]'} lg:block hidden`}
        style={{ width: mobileOpen ? 280 : undefined }}
      >
        {renderNav()}
      </aside>
      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 flex flex-col w-[280px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden`}
      >
        {renderNav()}
      </aside>
    </>
  );
}
