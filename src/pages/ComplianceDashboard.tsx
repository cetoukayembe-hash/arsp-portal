import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, FileText, Upload, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ComplianceDashboard() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'obligations' | 'subcontractors'>('documents');

  const documents = [
    { id: 1, name: 'RCCM', expiry: '2027-03-15', status: 'valid' as const },
    { id: 2, name: 'Attestation Fiscale', expiry: '2026-05-30', status: 'expiring' as const },
    { id: 3, name: 'Attestation CNSS', expiry: '2026-06-10', status: 'expiring' as const },
    { id: 4, name: 'Attestation de conformite OHADA', expiry: '2026-04-15', status: 'expired' as const },
    { id: 5, name: 'Licence sectorielle', expiry: '2028-01-01', status: 'valid' as const },
  ];

  const obligations = [
    { id: 1, title: 'Declarer les sous-traitants', deadline: '2026-06-30', done: true },
    { id: 2, title: 'Renouveler attestation fiscale', deadline: '2026-05-30', done: false },
    { id: 3, title: 'Deposer rapport annuel ARSP', deadline: '2026-07-15', done: false },
    { id: 4, title: 'Mettre a jour la liste du personnel', deadline: '2026-08-01', done: false },
    { id: 5, title: 'Renouveler attestation CNSS', deadline: '2026-06-10', done: false },
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: con } = await supabase.from('contracts').select('*');
      const { data: ent } = await supabase.from('enterprises').select('*');
      if (con) setContracts(con);
      if (ent) setEnterprises(ent);
    }
    fetchData();
  }, []);

  const validDocs = documents.filter(d => d.status === 'valid').length;
  const totalDocs = documents.length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const complianceScore = Math.round((validDocs / totalDocs) * 100);

  const getStatusIcon = (status: string) => {
    if (status === 'valid') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'expiring') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'valid') return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Valide</span>;
    if (status === 'expiring') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Expire bientot</span>;
    return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Expire</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Bon';
    if (score >= 60) return 'Moyen';
    return 'Critique';
  };

  const nextDeadline = obligations.filter(o => !o.done).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Tableau de bord de conformite</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Score de conformite</span>
            <ShieldCheck className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(complianceScore)}`}>{complianceScore}%</div>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${complianceScore >= 80 ? 'bg-emerald-500' : complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: complianceScore + '%' }}
              />
            </div>
          </div>
          <p className={`text-xs mt-1 font-medium ${getScoreColor(complianceScore)}`}>{getScoreLabel(complianceScore)}</p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Documents valides</span>
            <FileText className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540]">{validDocs}/{totalDocs}</div>
          <p className="text-xs text-amber-600 mt-1">{totalDocs - validDocs} document(s) a renouveler</p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Contrats actifs</span>
            <TrendingUp className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-3xl font-bold text-[#0a2540]">{activeContracts}</div>
          <p className="text-xs text-emerald-600 mt-1">donnees en temps reel</p>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Prochaine echeance</span>
            <Calendar className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-lg font-bold text-[#0a2540]">{nextDeadline ? nextDeadline.deadline : 'Aucune'}</div>
          <p className="text-xs text-gray-500 mt-1">{nextDeadline ? nextDeadline.title : 'Toutes les obligations sont remplies'}</p>
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
            {tab === 'documents' ? 'Documents' : tab === 'obligations' ? 'Obligations legales' : 'Sous-traitants'}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <div className="overflow-x-auto">
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <span className="font-medium text-[#0a2540]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.expiry}</td>
                    <td className="px-4 py-3">{getStatusLabel(doc.status)}</td>
                    <td className="px-4 py-3">
                      {doc.status === 'valid' ? (
                        <button className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline">
                          <Upload className="w-3 h-3" />Telecharger
                        </button>
                      ) : (
                        <button className="flex items-center gap-1 text-xs text-amber-600 hover:underline">
                          <RefreshCw className="w-3 h-3" />Renouveler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Obligations Tab */}
      {activeTab === 'obligations' && (
        <div className="space-y-3">
          {obligations.map((ob) => (
            <div key={ob.id} className="bg-white rounded-xl p-4 card-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ob.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-[#0a2540] text-sm">{ob.title}</p>
                  <p className="text-xs text-gray-500">Echeance: {ob.deadline}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ob.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {ob.done ? 'Fait' : 'En attente'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subcontractors Tab */}
      {activeTab === 'subcontractors' && (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          {enterprises.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Aucun sous-traitant enregistre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F6F9FC]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Entreprise</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Secteur</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Province</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Capital %</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enterprises.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#0a2540]">{e.name}</td>
                      <td className="px-4 py-3 text-gray-600">{e.sector}</td>
                      <td className="px-4 py-3 text-gray-600">{e.province}</td>
                      <td className="px-4 py-3 text-gray-600">{e.congolese_capital}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          e.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          e.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {e.status === 'active' ? 'Agree' : e.status === 'pending' ? 'En attente' : 'Suspendu'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}