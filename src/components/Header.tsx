import { useState } from 'react';
import { Bell, Globe, LogOut, ChevronDown, Search, X } from 'lucide-react';
import { useAuth } from '@/App';

export function Header() {
  const auth = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  const notifications = [
    { id: 1, message: 'Votre attestation fiscale expire dans 15 jours', type: 'warning', time: 'Il y a 2h' },
    { id: 2, message: 'Nouvel appel d\'offres dans votre secteur (Construction)', type: 'info', time: 'Il y a 5h' },
    { id: 3, message: 'Document CNSS validé par l\'ARSP', type: 'success', time: 'Hier' },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="hidden lg:block w-8" />
        <h1 className="text-lg font-semibold text-[#0a2540] hidden sm:block">Portail Numérique ARSP</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center bg-[#F6F9FC] rounded-lg px-3 py-1.5 border border-gray-200">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-sm outline-none w-40 text-[#1a1a2e] placeholder:text-gray-400"
          />
        </div>

        {/* Language */}
        <button
          onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{lang}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-[#0a2540]">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 text-center">
                <button className="text-xs text-[#007FFF] hover:underline">Marquer tout comme lu</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        {auth.isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold">
                U
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-sm text-[#0a2540]">Utilisateur ARSP</p>
                  <p className="text-xs text-gray-500">contact@entreprise.cd</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { auth.logout(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
