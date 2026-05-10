import { useState, useEffect } from 'react';
import { Gavel, Plus, X, FileText, Send, CheckCircle2, Clock, ChevronRight, Upload, Scale } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function DisputeResolution() {
  const auth = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [disputeMessages, setDisputeMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [disputeTab, setDisputeTab] = useState<'dossier' | 'messages'>('dossier');
  const [newDispute, setNewDispute] = useState({
    contract_id: '',
    description: '',
    category: 'Paiement',
    desired_outcome: '',
    defendant_email: '',
    defendant_name: '',
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: dis } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
    const { data: con } = await supabase.from('contracts').select('*');
    if (dis) setDisputes(dis);
    if (con) setContracts(con);
    setLoading(false);
  }

  async function fetchDisputeMessages(disputeId: string) {
    const { data } = await supabase.from('dispute_messages').select('*').eq('dispute_id', disputeId).order('created_at', { ascending: true });
    if (data) setDisputeMessages(data);
  }

  async function handleCreateDispute() {
    const caseNumber = 'LIT-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-4);
    const { error } = await supabase.from('disputes').insert([{
      case_number: caseNumber,
      contract_id: newDispute.contract_id || null,
      plaintiff_email: auth.userEmail,
      plaintiff_name: auth.userEmail,
      defendant_email: newDispute.defendant_email,
      defendant_name: newDispute.defendant_name,
      description: newDispute.description,
      category: newDispute.category,
      desired_outcome: newDispute.desired_outcome,
      status: 'open',
    }]);
    if (!error) {
      setShowNew(false);
      setNewDispute({ contract_id: '', description: '', category: 'Paiement', desired_outcome: '', defendant_email: '', defendant_name: '' });
      fetchData();
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedDispute) return;
    await supabase.from('dispute_messages').insert([{
      dispute_id: selectedDispute.id,
      sender_email: auth.userEmail,
      sender_name: auth.userEmail,
      content: newMessage,
    }]);
    setNewMessage('');
    fetchDisputeMessages(selectedDispute.id);
  }

  async function updateDisputeStatus(id: string, status: string) {
    await supabase.from('disputes').update({ status }).eq('id', id);
    fetchData();
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Ouvert', color: 'bg-gray-100 text-gray-700' },
    under_review: { label: 'En examen', color: 'bg-blue-100 text-blue-700' },
    mediation: { label: 'Mediation', color: 'bg-amber-100 text-amber-700' },
    resolved: { label: 'Resolu', color: 'bg-emerald-100 text-emerald-700' },
    closed: { label: 'Cloture', color: 'bg-gray-100 text-gray-500' },
  };

  const filtered = disputes.filter(d => filter === 'all' || d.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Resolution des Litiges</h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]"
        >
          <Plus className="w-4 h-4" />
          Ouvrir un litige
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'open', 'under_review', 'mediation', 'resolved', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {f === 'all' ? 'Tous' : statusConfig[f]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun litige</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">
            Ouvrir un premier litige
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const cfg = statusConfig[d.status] || statusConfig.open;
            return (
              <div
                key={d.id}
                onClick={() => { setSelectedDispute(d); fetchDisputeMessages(d.id); setDisputeTab('dossier'); }}
                className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Gavel className="w-4 h-4 text-[#007FFF]" />
                      <span className="text-sm font-semibold text-[#0a2540]">{d.case_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{d.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{d.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ouvert le {d.opened_date}</span>
                      {d.defendant_email && <span>{d.plaintiff_email} vs {d.defendant_email}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Dispute Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouveau litige</h3>
                <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contrat concerne</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newDispute.contract_id} onChange={(e) => setNewDispute({...newDispute, contract_id: e.target.value})}>
                    <option value="">Selectionner un contrat (optionnel)</option>
                    {contracts.map(c => <option key={c.id} value={c.id}>{c.reference} - {c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email du defendeur</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="email@entreprise.cd" value={newDispute.defendant_email} onChange={(e) => setNewDispute({...newDispute, defendant_email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newDispute.category} onChange={(e) => setNewDispute({...newDispute, category: e.target.value})}>
                    <option>Paiement</option>
                    <option>Qualite</option>
                    <option>Delai</option>
                    <option>Non-respect des termes</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none" placeholder="Decrivez le litige en detail..." value={newDispute.description} onChange={(e) => setNewDispute({...newDispute, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pieces justificatives</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#007FFF] cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Glisser-deposer ou cliquer</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue souhaitee</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mediation', 'Arbitrage', 'Resiliation', 'Dommages et interets'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setNewDispute({...newDispute, desired_outcome: opt})}
                        className={`px-3 py-1.5 border rounded-lg text-xs transition-colors ${newDispute.desired_outcome === opt ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleCreateDispute} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC]">
                  Soumettre le litige
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDispute(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0a2540]">{selectedDispute.case_number}</h3>
                  <p className="text-sm text-gray-500">{selectedDispute.category}</p>
                </div>
                <button onClick={() => setSelectedDispute(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
                {(['dossier', 'messages'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDisputeTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${disputeTab === tab ? 'bg-[#0a2540] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {tab === 'dossier' ? 'Dossier' : 'Messages'}
                  </button>
                ))}
              </div>

              {disputeTab === 'dossier' && (
                <div className="space-y-4">
                  <div className="bg-[#F6F9FC] rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedDispute.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Plaignant</div>
                      <div className="font-medium text-[#0a2540]">{selectedDispute.plaintiff_email}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Defendeur</div>
                      <div className="font-medium text-[#0a2540]">{selectedDispute.defendant_email || 'N/A'}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Issue souhaitee</div>
                      <div className="font-medium text-[#0a2540]">{selectedDispute.desired_outcome || 'N/A'}</div>
                    </div>
                    <div className="bg-[#F6F9FC] rounded-lg p-3">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div className="font-medium text-[#0a2540]">{statusConfig[selectedDispute.status]?.label}</div>
                    </div>
                  </div>
                  {auth.userRole === 'admin' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Mettre a jour le statut</label>
                      <select
                        value={selectedDispute.status}
                        onChange={(e) => { updateDisputeStatus(selectedDispute.id, e.target.value); setSelectedDispute({...selectedDispute, status: e.target.value}); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                      >
                        <option value="open">Ouvert</option>
                        <option value="under_review">En examen</option>
                        <option value="mediation">Mediation</option>
                        <option value="resolved">Resolu</option>
                        <option value="closed">Cloture</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {disputeTab === 'messages' && (
                <div>
                  <div className="space-y-3 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-3">
                    {disputeMessages.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm">Aucun message. Demarrez la conversation.</p>
                    ) : disputeMessages.map((msg) => (
                      <div key={msg.id} className={`flex gap-2 ${msg.sender_email === auth.userEmail ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-xl text-sm shadow-sm ${msg.sender_email === auth.userEmail ? 'bg-[#007FFF] text-white' : 'bg-white text-gray-800'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_email === auth.userEmail ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ecrire un message..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage} className="p-2 bg-[#007FFF] text-white rounded-lg hover:bg-[#0066CC]">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}