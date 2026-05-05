import { useState } from 'react';
import { Search, Bell, Calendar, MapPin, Users, ChevronRight, CheckCircle2, AlertTriangle, Send, X, Upload } from 'lucide-react';
import { tenders, sectors, provinces } from '@/data/mockData';

export function TenderOpportunities() {
  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showApply, setShowApply] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'history'>('all');

  const filtered = tenders.filter((t) => {
    const matchesQuery = !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.reference.toLowerCase().includes(query.toLowerCase());
    const matchesSector = !sectorFilter || t.sector === sectorFilter;
    const matchesProvince = !provinceFilter || t.province === provinceFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesQuery && matchesSector && matchesProvince && matchesStatus;
  });

  const getDaysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const statusBadge = (status: string, deadline: string) => {
    const days = getDaysLeft(deadline);
    if (status === 'closed') return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase">Clôturé</span>;
    if (days <= 7) return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Clôture dans {days}j</span>;
    return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Ouvert</span>;
  };

  return (
    <div>
      <div className="relative h-48 rounded-xl overflow-hidden mb-6">
        <img src="/mining-sector.jpeg" alt="Mines" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a2540]/60 flex items-center px-8">
          <h2 className="text-3xl font-bold text-white">Appels d'Offres</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'alerts', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab === 'all' ? 'Tous les appels' : tab === 'alerts' ? 'Mes alertes' : 'Historique'}
          </button>
        ))}
        <button
          onClick={() => setShowAlerts(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[#007FFF] text-white text-sm font-medium hover:bg-[#0066CC] transition-colors"
        >
          <Bell className="w-4 h-4" />
          Configurer alertes
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 card-shadow mb-6 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="flex-1 bg-transparent py-2 text-sm outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Tous secteurs</option>
              {sectors.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Toutes provinces</option>
              {provinces.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="all">Tous statuts</option>
              <option value="open">Ouvert</option>
              <option value="closing">Bientôt clôturé</option>
              <option value="closed">Clôturé</option>
            </select>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {filtered.map((t) => {
              return (
                <div key={t.id} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[#0a2540]">{t.title}</h3>
                        {statusBadge(t.status, t.deadline)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{t.reference}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
                    </div>
                    <div className="flex md:flex-col gap-2 md:items-end">
                      <span className="text-sm font-bold text-[#0a2540]">{t.estimatedValue}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />{t.applicantsCount} candidat{t.applicantsCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{t.sector}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.province}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><Calendar className="w-3 h-3" />Clôture: {t.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {t.requirements.slice(0, 3).map((req, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">{req}</span>
                      ))}
                    </div>
                    {t.status !== 'closed' && (
                      <button
                        onClick={() => setShowApply(t.id)}
                        className="px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors flex items-center gap-2"
                      >
                        Postuler <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-xl p-8 text-center card-shadow">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Vos alertes configurées apparaîtront ici</p>
          <button onClick={() => setShowAlerts(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">Configurer une alerte</button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0a2540]">Fourniture de matériel agricole Kongo Central</h3>
                <p className="text-sm text-gray-500">AO-2026-005-ARSP • Soumis le 20/03/2026</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rejeté</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0a2540]">Consultation fiscale annuelle</h3>
                <p className="text-sm text-gray-500">AO-2026-007-ARSP • Soumis le 25/04/2026</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En examen</span>
            </div>
          </div>
        </div>
      )}

      {/* Apply Drawer */}
      {showApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowApply(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0a2540]">Soumission de candidature</h3>
                <button onClick={() => setShowApply(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              {(() => {
                const tender = tenders.find((t) => t.id === showApply);
                if (!tender) return null;
                return (
                  <div className="space-y-4">
                    <div className="bg-[#F6F9FC] rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Appel d'offres</p>
                      <p className="font-semibold text-[#0a2540]">{tender.title}</p>
                      <p className="text-sm text-gray-500">{tender.reference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dossier technique (PDF)</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#007FFF] transition-colors cursor-pointer">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Glisser-déposer ou cliquer pour sélectionner</p>
                        <p className="text-xs text-gray-400">PDF uniquement, max 10MB</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Offre financière (USD)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="250000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                      <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-24 resize-none" placeholder="Décrivez brièvement votre proposition..." />
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <input type="checkbox" id="declaration" className="w-4 h-4 mt-0.5 accent-[#007FFF]" />
                      <label htmlFor="declaration" className="text-sm text-gray-700">
                        Je déclare que toutes les informations fournies sont exactes et que mon entreprise remplit les critères d'éligibilité.
                      </label>
                    </div>
                    <button
                      onClick={() => { setShowApply(null); }}
                      className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Soumettre ma candidature
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Alert Config Modal */}
      {showAlerts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAlerts(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Configurer une alerte</h3>
                <button onClick={() => setShowAlerts(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs d'intérêt</label>
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((s) => (
                      <span key={s} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 cursor-pointer hover:bg-[#0a2540] hover:text-white transition-colors">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur minimum (USD)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="100000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification</label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-[#0a2540] text-white rounded-lg text-xs font-medium">Email</button>
                    <button className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600">In-app</button>
                    <button className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600">SMS</button>
                  </div>
                </div>
                <button onClick={() => setShowAlerts(false)} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-colors">
                  Sauvegarder l'alerte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
