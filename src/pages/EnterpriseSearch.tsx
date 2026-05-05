import { useState, useMemo } from 'react';
import { Search, Filter, X, CheckCircle2, AlertCircle, Ban, Users, MapPin, ChevronRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { enterprises, sectors, provinces } from '@/data/mockData';

export function EnterpriseSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minCapital, setMinCapital] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<typeof enterprises[0] | null>(null);

  const filtered = useMemo(() => {
    return enterprises.filter((e) => {
      const matchesQuery = !query || e.name.toLowerCase().includes(query.toLowerCase()) || e.rccm.toLowerCase().includes(query.toLowerCase()) || e.sector.toLowerCase().includes(query.toLowerCase());
      const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(e.sector);
      const matchesProvince = !selectedProvince || e.province === selectedProvince;
      const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
      const matchesCapital = e.congoleseCapitalPercent >= minCapital;
      return matchesQuery && matchesSector && matchesProvince && matchesStatus && matchesCapital;
    });
  }, [query, selectedSectors, selectedProvince, selectedStatus, minCapital]);

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    approved: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', label: 'Agréé' },
    pending: { icon: AlertCircle, color: 'text-amber-600 bg-amber-50', label: 'En attente' },
    suspended: { icon: Ban, color: 'text-red-600 bg-red-50', label: 'Suspendu' },
  };

  const toggleSector = (s: string) => {
    setSelectedSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const clearFilters = () => {
    setSelectedSectors([]);
    setSelectedProvince('');
    setSelectedStatus('all');
    setMinCapital(0);
    setQuery('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Registre des Entreprises</h2>

      {/* Search bar */}
      <div className="bg-white rounded-xl p-4 card-shadow mb-6">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher par nom, RCCM, secteur..."
              className="flex-1 bg-transparent py-2.5 text-sm outline-none text-[#1a1a2e]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters ? 'border-[#007FFF] bg-blue-50 text-[#007FFF]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Secteur</label>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedSectors.includes(s) ? 'bg-[#0a2540] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
              >
                <option value="">Toutes</option>
                {provinces.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Statut</label>
              <div className="flex gap-2">
                {(['all', 'approved', 'pending', 'suspended'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedStatus === s ? 'bg-[#0a2540] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'Tous' : s === 'approved' ? 'Agréé' : s === 'pending' ? 'En attente' : 'Suspendu'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Capital congolais min</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0" max="100" value={minCapital}
                  onChange={(e) => setMinCapital(parseInt(e.target.value))}
                  className="flex-1 accent-[#007FFF]"
                />
                <span className="text-sm font-bold text-[#0a2540] w-12">{minCapital}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Active filter tags */}
        {(selectedSectors.length > 0 || selectedProvince || selectedStatus !== 'all' || minCapital > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedSectors.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-[#0a2540] text-white rounded-full text-xs">
                {s} <button onClick={() => toggleSector(s)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {selectedProvince && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0a2540] text-white rounded-full text-xs">
                {selectedProvince} <button onClick={() => setSelectedProvince('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0a2540] text-white rounded-full text-xs">
                {selectedStatus === 'approved' ? 'Agréé' : selectedStatus === 'pending' ? 'En attente' : 'Suspendu'}
                <button onClick={() => setSelectedStatus('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {minCapital > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0a2540] text-white rounded-full text-xs">
                Capital ≥{minCapital}% <button onClick={() => setMinCapital(0)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-[#007FFF] hover:underline font-medium">Réinitialiser</button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => {
          const status = statusConfig[e.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={e.id}
              className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedEnterprise(e)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-sm font-bold">
                    {e.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0a2540] text-sm leading-tight">{e.name}</h3>
                    <p className="text-xs text-gray-500">{e.rccm}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{e.sector}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.province}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><Users className="w-3 h-3" />{e.employees}</span>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Conformité</span>
                  <span className="font-bold text-[#0a2540]">{e.complianceScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${e.complianceScore >= 80 ? 'bg-emerald-500' : e.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${e.complianceScore}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 bg-[#0a2540] text-white rounded-lg text-xs font-medium hover:bg-[#0d2f4f] transition-colors">
                  Voir profil
                </button>
                <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun résultat trouvé</p>
          <button onClick={clearFilters} className="mt-2 text-sm text-[#007FFF] hover:underline">Réinitialiser les filtres</button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEnterprise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEnterprise(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold">
                    {selectedEnterprise.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0a2540]">{selectedEnterprise.name}</h3>
                    <p className="text-sm text-gray-500">{selectedEnterprise.rccm}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEnterprise(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#F6F9FC] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Secteur</div>
                  <div className="text-sm font-semibold text-[#0a2540]">{selectedEnterprise.sector}</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Province</div>
                  <div className="text-sm font-semibold text-[#0a2540]">{selectedEnterprise.province}</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Capital congolais</div>
                  <div className="text-sm font-semibold text-[#0a2540]">{selectedEnterprise.congoleseCapitalPercent}%</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-3">
                  <div className="text-xs text-gray-500">Employés</div>
                  <div className="text-sm font-semibold text-[#0a2540]">{selectedEnterprise.employees}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                  <span>Score de conformité</span>
                  <span className="font-bold text-[#0a2540]">{selectedEnterprise.complianceScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${selectedEnterprise.complianceScore >= 80 ? 'bg-emerald-500' : selectedEnterprise.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${selectedEnterprise.complianceScore}%` }} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { navigate('/digital-id'); setSelectedEnterprise(null); }} className="flex-1 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors flex items-center justify-center gap-2">
                  Voir carte numérique <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => { navigate('/messages'); setSelectedEnterprise(null); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
