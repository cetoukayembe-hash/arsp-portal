import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, X, Users, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Approvals() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [filter, setFilter] = useState('pending');

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

  async function handleApprove(id: string) {
    await supabase.from('enterprises').update({ status: 'active' }).eq('id', id);
    setSelectedEnterprise(null);
    fetchEnterprises();
  }

  async function handleReject(id: string) {
    await supabase.from('enterprises').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    setSelectedEnterprise(null);
    setShowReject(false);
    setRejectReason('');
    fetchEnterprises();
  }

  async function handleSuspend(id: string) {
    await supabase.from('enterprises').update({ status: 'suspended' }).eq('id', id);
    setSelectedEnterprise(null);
    fetchEnterprises();
  }

  const filtered = enterprises.filter(e => filter === 'all' || e.status === filter);
  const pendingCount = enterprises.filter(e => e.status === 'pending').length;

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
    active: { label: 'Agree', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejete', color: 'bg-red-100 text-red-700' },
    suspended: { label: 'Suspendu', color: 'bg-gray-100 text-gray-600' },
  };

  const docLinks = [
    { key: 'doc_rccm', label: 'RCCM' },
    { key: 'doc_fiscal', label: 'Attestation Fiscale' },
    { key: 'doc_cnss', label: 'Attestation CNSS' },
    { key: 'doc_identity', label: 'Piece d identite' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">Approbations</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-1">{pendingCount} demande(s) en attente de validation</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
          {pendingCount}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'active', 'rejected', 'suspended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {f === 'all' ? 'Tous' : statusConfig[f]?.label}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune entreprise dans cette categorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const status = statusConfig[e.status] || statusConfig.pending;
            return (
              <div key={e.id} className="bg-white rounded-xl p-5 card-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {e.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[#0a2540]">{e.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{e.email}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {e.sector && <span>{e.sector}</span>}
                        {e.province && <span>{e.province}</span>}
                        {e.congolese_capital && <span>Capital: {e.congolese_capital}%</span>}
                        {e.rccm && <span>RCCM: {e.rccm}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedEnterprise(e)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3" />
                      Voir
                    </button>
                    {e.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(e.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approuver
                        </button>
                        <button
                          onClick={() => { setSelectedEnterprise(e); setShowReject(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600"
                        >
                          <XCircle className="w-3 h-3" />
                          Rejeter
                        </button>
                      </>
                    )}
                    {e.status === 'active' && (
                      <button
                        onClick={() => handleSuspend(e.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs hover:bg-gray-600"
                      >
                        <Clock className="w-3 h-3" />
                        Suspendre
                      </button>
                    )}
                    {e.status === 'suspended' && (
                      <button
                        onClick={() => handleApprove(e.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Reactiver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedEnterprise && !showReject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEnterprise(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">{selectedEnterprise.name}</h3>
                <button onClick={() => setSelectedEnterprise(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Email</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.email}</p></div>
                  <div><span className="text-gray-500">RCCM</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.rccm || 'N/A'}</p></div>
                  <div><span className="text-gray-500">NIF</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.tax_number || 'N/A'}</p></div>
                  <div><span className="text-gray-500">ID National</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.id_national || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Secteur</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.sector || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Province</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.province || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Employes</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.employees || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Capital congolais</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.congolese_capital}%</p></div>
                  <div><span className="text-gray-500">Type</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.type || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Annee</span><p className="font-medium text-[#0a2540]">{selectedEnterprise.founded_year || 'N/A'}</p></div>
                </div>

                {/* Documents */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Documents soumis</p>
                  <div className="grid grid-cols-2 gap-2">
                    {docLinks.map((doc) => {
                      const url = selectedEnterprise[doc.key] || '';
                      return url !== '' ? (
                        
                          key={doc.key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100"
                        >
                          <FileText className="w-3 h-3" />
                          {doc.label}
                        </a>
                      ) : (
                        <div key={doc.key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-lg text-xs">
                          <FileText className="w-3 h-3" />
                          {doc.label} (non fourni)
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedEnterprise.experience && selectedEnterprise.experience.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Experience</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEnterprise.experience.map((exp: string) => (
                        <span key={exp} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{exp}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEnterprise.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(selectedEnterprise.id)}
                      className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReject && selectedEnterprise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Rejeter la demande</h3>
                <button onClick={() => setShowReject(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-700">Vous allez rejeter la demande de <strong>{selectedEnterprise.name}</strong>.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Motif du rejet</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-24 resize-none"
                    placeholder="Expliquez pourquoi cette demande est rejetee..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => handleReject(selectedEnterprise.id)}
                  disabled={!rejectReason}
                  className="w-full py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}