import { useState, useEffect } from 'react';
import { FileText, Plus, X, CheckCircle2, Clock, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function Contracts() {
  const auth = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [newContract, setNewContract] = useState({
    title: '', reference: '', subcontractor_email: '',
    value: '', start_date: '', end_date: '', description: '',
  });

  useEffect(() => { fetchContracts(); }, []);

  useEffect(() => {
    if (selectedContract) {
      setDocUrl(selectedContract.document_url || '');
    }
  }, [selectedContract]);

  async function fetchContracts() {
    setLoading(true);
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setContracts(data);
    setLoading(false);
  }

  async function handleCreateContract() {
    let fileUrl = '';
    if (contractFile) {
      const fileName = 'contracts/' + Date.now() + '_' + contractFile.name;
      const { data: uploadData } = await supabase.storage
        .from('documents')
        .upload(fileName, contractFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }
    }
    const { error } = await supabase.from('contracts').insert([{
      title: newContract.title,
      reference: newContract.reference || 'CONT-' + Date.now(),
      subcontractor_email: newContract.subcontractor_email,
      prime_email: auth.userEmail || 'prime@arsp.cd',
      prime_id: auth.userId,
      value: parseFloat(newContract.value),
      start_date: newContract.start_date,
      end_date: newContract.end_date,
      description: newContract.description,
      document_url: fileUrl,
      status: 'draft',
      progress: 0,
    }]);
    if (!error) {
      setShowCreate(false);
      setContractFile(null);
      setNewContract({ title: '', reference: '', subcontractor_email: '', value: '', start_date: '', end_date: '', description: '' });
      fetchContracts();
    } else {
      console.error('Contract creation error:', error);
      alert('Erreur lors de la creation du contrat: ' + error.message);
    }
  }

  async function updateProgress(id: string, progress: number) {
    const { error } = await supabase.from('contracts').update({ progress }).eq('id', id);
    if (!error) {
      setSelectedContract((prev: any) => ({ ...prev, progress }));
      fetchContracts();
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', id);
    if (!error) {
      setSelectedContract((prev: any) => ({ ...prev, status }));
      fetchContracts();
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600', icon: FileText },
    active: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    completed: { label: 'Termine', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    disputed: { label: 'Litige', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Gestion des Contrats</h2>
        {auth.userRole === 'prime' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]"
          >
            <Plus className="w-4 h-4" />
            Nouveau contrat
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun contrat disponible</p>
          {auth.userRole === 'prime' && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">
              Creer le premier contrat
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const status = statusConfig[c.status] || statusConfig.draft;
            const Icon = status.icon;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContract(c)}
                className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-[#0a2540]">{c.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{c.reference}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {c.value && <span>USD {c.value}</span>}
                      {c.start_date && <span>Debut: {c.start_date}</span>}
                      {c.end_date && <span>Fin: {c.end_date}</span>}
                      {c.subcontractor_email && <span>{c.subcontractor_email}</span>}
                    </div>
                  </div>
                  <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#007FFF] h-1.5 rounded-full" style={{ width: c.progress + '%' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouveau contrat</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Titre du contrat" value={newContract.title} onChange={(e) => setNewContract({ ...newContract, title: e.target.value })} />
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Reference" value={newContract.reference} onChange={(e) => setNewContract({ ...newContract, reference: e.target.value })} />
                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Email du sous-traitant" value={newContract.subcontractor_email} onChange={(e) => setNewContract({ ...newContract, subcontractor_email: e.target.value })} />
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Valeur USD" value={newContract.value} onChange={(e) => setNewContract({ ...newContract, value: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date de debut</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newContract.start_date} onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date de fin</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newContract.end_date} onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })} />
                  </div>
                </div>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-20 resize-none" placeholder="Description" value={newContract.description} onChange={(e) => setNewContract({ ...newContract, description: e.target.value })} />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Document PDF</label>
                  <input type="file" accept=".pdf,.doc,.docx" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)} />
                </div>
                <button onClick={handleCreateContract} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC]">
                  Creer le contrat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContract(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0a2540]">{selectedContract.title}</h3>
                <button onClick={() => setSelectedContract(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Reference</span><p className="font-medium text-[#0a2540]">{selectedContract.reference}</p></div>
                  <div><span className="text-gray-500">Statut</span><p className="font-medium text-[#0a2540]">{statusConfig[selectedContract.status] ? statusConfig[selectedContract.status].label : 'Inconnu'}</p></div>
                  <div><span className="text-gray-500">Valeur</span><p className="font-medium text-[#0a2540]">USD {selectedContract.value}</p></div>
                  <div><span className="text-gray-500">Sous-traitant</span><p className="font-medium text-[#0a2540]">{selectedContract.subcontractor_email}</p></div>
                  <div><span className="text-gray-500">Debut</span><p className="font-medium text-[#0a2540]">{selectedContract.start_date}</p></div>
                  <div><span className="text-gray-500">Fin</span><p className="font-medium text-[#0a2540]">{selectedContract.end_date}</p></div>
                </div>
                {selectedContract.description && (
                  <div className="bg-[#F6F9FC] rounded-lg p-4">
                    <p className="text-sm text-gray-600">{selectedContract.description}</p>
                  </div>
                )}
                {auth.userRole === 'prime' && (
                  <div className="bg-[#F6F9FC] rounded-lg p-4">
                    <label className="text-sm font-medium text-[#0a2540] mb-2 block">
                      Progression: {selectedContract.progress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedContract.progress}
                      onChange={(e) => updateProgress(selectedContract.id, parseInt(e.target.value))}
                      className="w-full accent-[#007FFF]"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                {auth.userRole === 'prime' && (
                  <select
                    value={selectedContract.status}
                    onChange={(e) => updateStatus(selectedContract.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="completed">Termine</option>
                    <option value="disputed">Litige</option>
                  </select>
                )}
                {docUrl !== '' && (
                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Telecharger le document
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}