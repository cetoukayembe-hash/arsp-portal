import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, FileText, Upload, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';

const documents = [
  { id: 1, name: 'RCCM', expiry: '2027-03-15', status: 'valid' as const },
  { id: 2, name: 'Attestation Fiscale', expiry: '2026-05-30', status: 'expiring' as const },
  { id: 3, name: 'Attestation CNSS', expiry: '2026-06-10', status: 'expiring' as const },
  { id: 4, name: 'Attestation de conformité OHADA', expiry: '2026-04-15', status: 'expired' as const },
  { id: 5, name: 'Licence sectorielle', expiry: '2028-01-01', status: 'valid' as const },
];

const obligations = [
  { id: 1, name: 'Soumission des rapports annuels', dueDate: '2026-03-31', completed: true },
  { id: 2, name: "Mise à jour des données de personnel", dueDate: '2026-06-30', completed: false },
  { id: 3, name: 'Respect des ratios de capital congolais', dueDate: 'Permanent', completed: true },
  { id: 4, name: "Paiement des frais d'agrément", dueDate: '2026-06-15', completed: false },
  { id: 5, name: 'Déclaration des contrats sous-traitance', dueDate: '2026-05-15', completed: false },
];

export function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<'documents' | 'obligations' | 'subcontractors'>('documents');

  const statusIcons = {
    valid: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Valide' },
    expiring: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Expire bientôt' },
    expired: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Expiré' },
  };

  const validCount = documents.filter((d) => d.status === 'valid').length;
  const complianceScore = Math.round((validCount / documents.length) * 100);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Tableau de bord de conformité</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Score de conformité</span>
            <ShieldCheck className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={complianceScore >= 80 ? '#10B981' : complianceScore >= 60 ? '#F59E0B' : '#DC143C'} strokeWidth="3" strokeDasharray={`${complianceScore}, 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0a2540]">{complianceScore}%</span>
            </div>
            <div className="text-xs text-gray-500">
              {complianceScore >= 80 ? 'Excellent' : complianceScore >= 60 ? 'À améliorer' : 'Critique'}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Documents valides</span>
            <FileText className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">{validCount}/{documents.length}</div>
          <div className="text-xs text-gray-500">{documents.length - validCount} document(s) à renouveler</div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Contrats actifs</span>
            <TrendingUp className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">3</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+1 ce trimestre</div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Prochaine échéance</span>
            <Calendar className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-lg font-bold text-[#0a2540]">15 mai 2026</div>
          <div className="text-xs text-amber-600">Déclaration contrats sous-traitance</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['documents', 'obligations', 'subcontractors'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab === 'documents' ? 'Documents' : tab === 'obligations' ? 'Obligations légales' : 'Sous-traitants'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl card-shadow overflow-hidden">
        {activeTab === 'documents' && (
          <table className="w-full text-sm">
            <thead className="bg-[#F6F9FC]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Document</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Date d'expiration</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => {
                const cfg = statusIcons[doc.status];
                const Icon = cfg.icon;
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-[#0a2540]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.expiry}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.status !== 'valid' ? (
                        <button className="flex items-center gap-1 px-3 py-1 bg-[#007FFF] text-white rounded-lg text-xs font-medium hover:bg-[#0066CC] transition-colors">
                          <Upload className="w-3 h-3" />Renouveler
                        </button>
                      ) : (
                        <button className="flex items-center gap-1 px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                          <RefreshCw className="w-3 h-3" />Télécharger
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'obligations' && (
          <div className="divide-y divide-gray-100">
            {obligations.map((obl) => (
              <div key={obl.id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${obl.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {obl.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${obl.completed ? 'text-gray-500 line-through' : 'text-[#0a2540]'}`}>{obl.name}</p>
                    <p className="text-xs text-gray-400">Échéance: {obl.dueDate}</p>
                  </div>
                </div>
                {!obl.completed && (
                  <button className="px-3 py-1.5 bg-[#0a2540] text-white rounded-lg text-xs font-medium hover:bg-[#0d2f4f] transition-colors">
                    Compléter
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'subcontractors' && (
          <div className="divide-y divide-gray-100">
            {[
              { name: 'Bâtiments du Congo SARL', sector: 'Construction', score: 92, status: 'active' },
              { name: 'TechRDC Solutions', sector: 'IT', score: 88, status: 'active' },
              { name: 'AgriCongo Coopérative', sector: 'Agriculture', score: 79, status: 'warning' },
            ].map((sub, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold">
                    {sub.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0a2540]">{sub.name}</p>
                    <p className="text-xs text-gray-400">{sub.sector}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#0a2540]">{sub.score}%</div>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full ${sub.score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${sub.score}%` }} />
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sub.status === 'active' ? 'Actif' : 'Attention'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
