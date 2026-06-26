import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, X, Users, FileText, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: string;
  status: string;
  doc_rccm: string;
  doc_fiscal: string;
  doc_cnss: string;
  doc_identity: string;
  rejection_reason: string;
  created_at: string;
}

interface Enterprise {
  id: string;
  name: string;
  email: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  [key: string]: any;
}

export function Approvals() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'enterprises'>('accounts');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UserProfile | Enterprise | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    if (activeTab === 'accounts') {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (data) setUserProfiles(data);
    } else {
      const { data } = await supabase
        .from('enterprises')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (data) setEnterprises(data);
    }
    setLoading(false);
  }

  async function handleApproveUser(id: string) {
    // Approve user account
    const { error: profileErr } = await supabase.from('user_profiles').update({ status: 'active' }).eq('id', id);
    if (profileErr) console.error('Profile update error:', profileErr);
    
    // Approve linked enterprise
    const { error: entErr } = await supabase.from('enterprises').update({ status: 'active' }).eq('user_id', id);
    if (entErr) console.error('Enterprise update error:', entErr);
    
    // Get enterprise data for digital ID
    const { data: enterprise } = await supabase
      .from('enterprises')
      .select('id, name, created_at')
      .eq('user_id', id)
      .single();
    
    if (enterprise) {
      // Generate ARSP ID: ARSP-YYYY-XXXXX
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const arspId = `ARSP-${year}-${randomSuffix}`;
      
      // Valid for 3 years
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 3);
      
      // Create digital ID
      await supabase.from('digital_ids').insert({
        user_id: id,
        enterprise_id: enterprise.id,
        arsp_id: arspId,
        valid_from: validFrom.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'active',
      });
    }
    
    logAudit('ACCOUNT_APPROVE', 'user_profiles', id);
    setSelectedItem(null);
    fetchData();
  }

  async function handleRejectUser(id: string) {
    await supabase.from('user_profiles').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    logAudit('ACCOUNT_REJECT', 'user_profiles', id, { reason: rejectReason });
    setSelectedItem(null);
    setShowReject(false);
    setRejectReason('');
    fetchData();
  }

  async function handleApproveEnterprise(id: string) {
    await supabase.from('enterprises').update({ status: 'active' }).eq('id', id);
    logAudit('ENTERPRISE_APPROVE', 'enterprises', id);
    setSelectedItem(null);
    fetchData();
  }

  async function handleRejectEnterprise(id: string) {
    await supabase.from('enterprises').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    logAudit('ENTERPRISE_REJECT', 'enterprises', id, { reason: rejectReason });
    setSelectedItem(null);
    setShowReject(false);
    setRejectReason('');
    fetchData();
  }

  const pendingUsersCount = userProfiles.length;
  const pendingEnterprisesCount = enterprises.length;

  const docLinks = [
    { key: 'doc_rccm', label: 'RCCM' },
    { key: 'doc_fiscal', label: 'Attestation Fiscale' },
    { key: 'doc_cnss', label: 'Attestation CNSS' },
    { key: 'doc_identity', label: 'Piece identite' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">Approbations</h2>
          <p className="text-sm text-gray-500 mt-1">Gestion des comptes et entreprises en attente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'accounts' ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Comptes
            {pendingUsersCount > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs">{pendingUsersCount}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('enterprises')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'enterprises' ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Entreprises
            {pendingEnterprisesCount > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs">{pendingEnterprisesCount}</span>
            )}
          </div>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : activeTab === 'accounts' ? (
        /* User Accounts List */
        userProfiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl card-shadow">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun compte en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userProfiles.map((user) => (
              <div key={user.id} className="bg-white rounded-xl p-5 card-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[#0a2540]">{user.full_name || user.email}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                          En attente
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{user.email}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{user.company_name}</span>
                        <span>•</span>
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelectedItem(user)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                      <Eye className="w-3 h-3" />Voir
                    </button>
                    <button onClick={() => handleApproveUser(user.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />Approuver
                    </button>
                    <button onClick={() => { setSelectedItem(user); setShowReject(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">
                      <XCircle className="w-3 h-3" />Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Enterprises List */
        enterprises.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl card-shadow">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune entreprise en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enterprises.map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-5 card-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {e.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[#0a2540]">{e.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                          En attente
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{e.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelectedItem(e)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                      <Eye className="w-3 h-3" />Voir
                    </button>
                    <button onClick={() => handleApproveEnterprise(e.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />Approuver
                    </button>
                    <button onClick={() => { setSelectedItem(e); setShowReject(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">
                      <XCircle className="w-3 h-3" />Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* User Detail Modal */}
      {selectedItem && 'email' in selectedItem && !showReject && activeTab === 'accounts' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">{(selectedItem as UserProfile).full_name || (selectedItem as UserProfile).email}</h3>
                <button onClick={() => setSelectedItem(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Email</span><p className="font-medium text-[#0a2540]">{(selectedItem as UserProfile).email}</p></div>
                  <div><span className="text-gray-500">Entreprise</span><p className="font-medium text-[#0a2540]">{(selectedItem as UserProfile).company_name || 'N/A'}</p></div>
                  <div><span className="text-gray-500">Role</span><p className="font-medium text-[#0a2540] capitalize">{(selectedItem as UserProfile).role}</p></div>
                  <div><span className="text-gray-500">Date</span><p className="font-medium text-[#0a2540]">{new Date((selectedItem as UserProfile).created_at).toLocaleDateString('fr-FR')}</p></div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Documents soumis</p>
                  <div className="grid grid-cols-2 gap-2">
                    {docLinks.map((doc) => {
                      const url = (selectedItem as any)[doc.key] || '';
                      return url ? (
                        <a key={doc.key} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                          <FileText className="w-3 h-3" />{doc.label}
                        </a>
                      ) : (
                        <div key={doc.key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-400 rounded-lg text-xs">
                          <FileText className="w-3 h-3" />{doc.label} (non fourni)
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleApproveUser((selectedItem as UserProfile).id)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />Approuver
                  </button>
                  <button onClick={() => setShowReject(true)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" />Rejeter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Rejeter la demande</h3>
                <button onClick={() => setShowReject(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-700">Vous allez rejeter la demande de <strong>{'full_name' in selectedItem ? (selectedItem as UserProfile).full_name || (selectedItem as UserProfile).email : (selectedItem as Enterprise).name}</strong>.</p>
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
                  onClick={() => {
                    if ('full_name' in selectedItem) {
                      handleRejectUser((selectedItem as UserProfile).id);
                    } else {
                      handleRejectEnterprise((selectedItem as Enterprise).id);
                    }
                  }} 
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