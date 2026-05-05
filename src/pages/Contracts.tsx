import { useState } from 'react';
import { MoreHorizontal, FileText, AlertTriangle, CheckCircle2, PenLine, Download, Plus, ChevronRight } from 'lucide-react';
import { contracts, enterprises } from '@/data/mockData';

const columns = [
  { id: 'draft', label: 'Brouillon', color: 'bg-gray-100' },
  { id: 'negotiating', label: 'En négociation', color: 'bg-blue-50' },
  { id: 'pending_signature', label: 'En attente de signature', color: 'bg-amber-50' },
  { id: 'active', label: 'Actif', color: 'bg-emerald-50' },
  { id: 'completed', label: 'Terminé', color: 'bg-gray-50' },
  { id: 'disputed', label: 'Litige', color: 'bg-red-50' },
];

export function Contracts() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  const getEnterpriseName = (id: string) => enterprises.find((e) => e.id === id)?.name || id;

  const getProgress = (start: string, end: string) => {
    const total = new Date(end).getTime() - new Date(start).getTime();
    const elapsed = Date.now() - new Date(start).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Gestion des Contrats</h2>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 text-xs font-medium ${viewMode === 'kanban' ? 'bg-[#0a2540] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Kanban</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-medium ${viewMode === 'list' ? 'bg-[#0a2540] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Liste</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors">
            <Plus className="w-4 h-4" />
            Nouveau contrat
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colContracts = contracts.filter((c) => c.status === col.id);
            return (
              <div key={col.id} className="w-80 shrink-0">
                <div className={`flex items-center justify-between p-3 rounded-t-lg ${col.color}`}>
                  <span className="text-sm font-semibold text-[#0a2540]">{col.label}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">{colContracts.length}</span>
                </div>
                <div className="bg-white rounded-b-xl card-shadow p-3 space-y-3 min-h-[200px]">
                  {colContracts.map((c) => {
                    const progress = getProgress(c.startDate, c.endDate);
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContract(c.id)}
                        className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-gray-400">{c.reference}</span>
                          <button className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-3 h-3 text-gray-400" /></button>
                        </div>
                        <p className="text-sm font-medium text-[#0a2540] mb-2">{c.title}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-[10px] font-bold">
                            {getEnterpriseName(c.primeContractorId).split(' ').map((w) => w[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-xs text-gray-500">{getEnterpriseName(c.primeContractorId)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{c.startDate} → {c.endDate}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div className="bg-[#007FFF] h-1 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs font-bold text-[#0a2540]">{c.value}</span>
                          <span className="text-xs text-gray-400">{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F9FC]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Référence</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Titre</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Donneur d'ordres</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Valeur</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedContract(c.id)}>
                  <td className="px-4 py-3 text-gray-500">{c.reference}</td>
                  <td className="px-4 py-3 font-medium text-[#0a2540]">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{getEnterpriseName(c.primeContractorId)}</td>
                  <td className="px-4 py-3 font-medium text-[#0a2540]">{c.value}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'disputed' ? 'bg-red-100 text-red-700' :
                      c.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                      c.status === 'pending_signature' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {columns.find((col) => col.id === c.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContract(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const c = contracts.find((x) => x.id === selectedContract);
              if (!c) return null;
              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0a2540]">{c.title}</h3>
                      <p className="text-sm text-gray-500">{c.reference}</p>
                    </div>
                    <button onClick={() => setSelectedContract(null)} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5 text-gray-500 rotate-90" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Donneur d'ordres</div>
                      <div className="text-sm font-medium text-[#0a2540]">{getEnterpriseName(c.primeContractorId)}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Sous-traitant</div>
                      <div className="text-sm font-medium text-[#0a2540]">{getEnterpriseName(c.subcontractorId)}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Valeur</div>
                      <div className="text-sm font-medium text-[#0a2540]">{c.value}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div className="text-sm font-medium text-[#0a2540]">{columns.find((col) => col.id === c.status)?.label}</div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Chronologie</h4>
                    <div className="space-y-3">
                      {[
                        { date: c.startDate, label: 'Contrat créé', icon: FileText, color: 'bg-gray-200' },
                        { date: '2025-02-15', label: 'Négociation démarrée', icon: PenLine, color: 'bg-blue-200' },
                        c.status !== 'draft' && c.status !== 'negotiating' ? { date: '2025-04-01', label: 'Signé par les parties', icon: CheckCircle2, color: 'bg-emerald-200' } : null,
                      ].filter(Boolean).map((event: any, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center`}>
                            <event.icon className="w-4 h-4 text-[#0a2540]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0a2540]">{event.label}</p>
                            <p className="text-xs text-gray-500">{event.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors">
                      <Download className="w-4 h-4" /> Télécharger contrat
                    </button>
                    {c.status === 'active' && (
                      <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                        <AlertTriangle className="w-4 h-4" /> Signaler un problème
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
