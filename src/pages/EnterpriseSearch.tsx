import { useState, useEffect } from 'react';
import { Search, X, CheckCircle2, AlertCircle, Ban, Users, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const sectors = ['Construction', 'Mining', 'Logistics', 'IT', 'Agriculture', 'Energy', 'Services', 'Healthcare'];
const provinces = ['Kinshasa', 'Haut-Katanga', 'Lualaba', 'Kongo Central', 'Nord-Kivu', 'Sud-Kivu', 'Ituri', 'Maniema'];

export function EnterpriseSearch() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [capitalFilter, setCapitalFilter] = useState('');
  const [selectedEnterprise, setSelectedEnterprise] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchEnterprises(); }, []);

  async function fetchEnterprises() {
    setLoading(true);
    const { data } = await supabase
      .from('enterprises')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEnterprises(data);
    setLoading(false);
  }

  const filtered = enterprises.filter(e => {
    const matchesQuery = !query ||
      e.name?.toLowerCase().includes(query.toLowerCase()) ||
      e.rccm?.toLowerCase().includes(query.toLowerCase()) ||
      e.sector?.toLowerCase().includes(query.toLowerCase());
    const matchesSector = !sectorFilter || e.sector === sectorFilter;
    const matchesProvince = !provinceFilter || e.province === provinceFilter;
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const matchesCapital = !capitalFilter ||
      (capitalFilter === '51' && e.congolese_capital >= 51) ||
      (capitalFilter === '70' && e.congolese_capital >= 70) ||
      (capitalFilter === '100' && e.congolese_capital === 100);
    return matchesQuery && matchesSector && matchesProvince && matchesStatus && matchesCapital;
  });

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'pending') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <Ban className="w-4 h-4 text-red-500" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'active') return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Agree</span>;
    if (status === 'pending') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En attente</span>;
    return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Suspendu</span>;
  };

  function resetFilters() {
    setQuery('');
    setSectorFilter('');
    setProvinceFilter('');
    setStatusFilter('');
    setCapitalFilter('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Registre des Entreprises</h2>
        <span className="text-sm text-gray-500">{filtered.length} entreprise(s) trouvee(s)</span>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl p-4 card-shadow mb-4">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher par nom, RCCM, secteur..."
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-[#0a2540] text-white border-[#0a2540]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Tous secteurs</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Toutes provinces</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Tous statuts</option>
              <option value="active">Agree</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
            </select>
            <select
              value={capitalFilter}
              onChange={(e) => setCapitalFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white"
            >
              <option value="">Capital congolais</option>
              <option value="51">51% et plus</option>
              <option value="70">70% et plus</option>
              <option value="100">100%</option>
            </select>
            <button
              onClick={resetFilters}
              className="col-span-2 md:col-span-4 text-sm text-red-500 hover:underline text-center"
            >
              Reinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement du registre...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun resultat trouve</p>
          <button onClick={resetFilters} className="mt-3 text-sm text-[#007FFF] hover:underline">
            Reinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelectedEnterprise(e)}
              className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {e.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-[#0a2540]">{e.name}</h3>
                      {getStatusLabel(e.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{e.rccm}</p>
                    <div className="flex flex-wrap gap-2">
                      {e.sector && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{e.sector}</span>
                      )}
                      {e.province && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{e.province}
                        </span>
                      )}
                      {e.employees && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1">
                          <Users className="w-3 h-3" />{e.employees} employes
                        </span>
                      )}
                      {e.congolese_capital && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          Capital: {e.congolese_capital}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enterprise Detail Modal */}
      {selectedEnterprise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEnterprise(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold">
                    {selectedEnterprise.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0a2540]">{selectedEnterprise.name}</h3>
                    <p className="text-xs text-gray-500">{selectedEnterprise.rccm}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEnterprise(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedEnterprise.status)}
                  {getStatusLabel(selectedEnterprise.status)}
                </div>

                <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Secteur</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.sector || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Province</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.province || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Ville</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.city || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Employes</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.employees || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Capital congolais</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.congolese_capital}%</p></div>
                  <div><span className="text-gray-500">Type</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.type || 'N/A'}</p></div>
                  <div><span className="text-gray-500">NIF</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.tax_number || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Email</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.email || 'N/A'}</p></div>
                </div>

                {selectedEnterprise.experience && selectedEnterprise.experience.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Secteurs d experience</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEnterprise.experience.map((exp: string) => (
                        <span key={exp} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{exp}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}