import { useState, useEffect } from 'react';
import { FileText, Plus, X, CheckCircle2, Clock, AlertTriangle, Download, Search, Building2, Mail, Hash, MapPin, Briefcase, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

type DocumentType = 'contract' | 'purchase_order';

interface SubcontractorOption {
  id: string;
  name: string;
  email: string;
  rccm: string;
  id_national: string;
  tax_number: string;
  province: string;
  sector: string;
  congolese_capital: number;
}

interface PrimeDetails {
  name: string;
  email: string;
  rccm: string;
  idnat: string;
  tax_number: string;
  province: string;
  sector: string;
}

export function Contracts() {
  const auth = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const [primeDetails, setPrimeDetails] = useState<PrimeDetails | null>(null);

  // New form state
  const [documentType, setDocumentType] = useState<DocumentType>('contract');
  const [searchQuery, setSearchQuery] = useState('');
  const [subcontractors, setSubcontractors] = useState<SubcontractorOption[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<SubcontractorOption | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  const [newContract, setNewContract] = useState({
    title: '', reference: '', subcontractor_email: '',
    subcontractor_name: '', subcontractor_rccm: '', subcontractor_idnat: '',
    subcontractor_tax_number: '', subcontractor_province: '', subcontractor_sector: '',
    value: '', start_date: '', end_date: '', delivery_date: '', description: '',
    items: '',
  });

  useEffect(() => { 
    fetchContracts(); 
    fetchPrimeDetails(); 
  }, []);

  useEffect(() => {
    if (selectedContract) {
      setDocUrl(selectedContract.document_url || '');
    }
  }, [selectedContract]);

  async function fetchPrimeDetails() {
    if (!auth.userId) return;
    
    const { data } = await supabase
      .from('enterprises')
      .select('name, email, rccm, id_national, tax_number, province, sector')
      .eq('user_id', auth.userId)
      .single();
    
    if (data) {
      setPrimeDetails({
        name: data.name,
        email: data.email,
        rccm: data.rccm || '',
        idnat: data.id_national || '',
        tax_number: data.tax_number || '',
        province: data.province || '',
        sector: data.sector || '',
      });
    }
  }

  async function fetchContracts() {
    setLoading(true);
    
    let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
    
    if (auth.userRole === 'subcontractor') {
      query = query.eq('subcontractor_email', auth.userEmail);
    } else if (auth.userRole === 'prime') {
      query = query.eq('prime_id', auth.userId);
    }
    
    const { data } = await query;
    if (data) setContracts(data);
    setLoading(false);
  }

  // Search subcontractors from registered enterprises
  async function searchSubcontractors(query: string) {
    if (query.length < 2) {
      setSubcontractors([]);
      setShowSearchResults(false);
      return;
    }
    
    const { data } = await supabase
      .from('enterprises')
      .select('id, name, email, rccm, id_national, tax_number, province, sector, congolese_capital')
      .ilike('name', `%${query}%`)
      .eq('status', 'active')
      .limit(5);
    
    if (data) {
      setSubcontractors(data);
      setShowSearchResults(true);
    }
  }

  function selectSubcontractor(sub: SubcontractorOption) {
    setSelectedSubcontractor(sub);
    setNewContract(prev => ({
      ...prev,
      subcontractor_email: sub.email,
      subcontractor_name: sub.name,
      subcontractor_rccm: sub.rccm || '',
      subcontractor_idnat: sub.id_national || '',
      subcontractor_tax_number: sub.tax_number || '',
      subcontractor_province: sub.province || '',
      subcontractor_sector: sub.sector || '',
    }));
    setSearchQuery(sub.name);
    setShowSearchResults(false);
    setManualEntry(false);
  }

  function clearSubcontractor() {
    setSelectedSubcontractor(null);
    setSearchQuery('');
    setNewContract(prev => ({
      ...prev,
      subcontractor_email: '', subcontractor_name: '', subcontractor_rccm: '',
      subcontractor_idnat: '', subcontractor_tax_number: '', subcontractor_province: '',
      subcontractor_sector: '',
    }));
  }

  async function handleCreateContract() {
    if (!primeDetails) {
      alert('Veuillez d\'abord completer votre profil entreprise');
      return;
    }

    if (!newContract.title) {
      alert('Veuillez entrer un titre');
      return;
    }
    if (!newContract.subcontractor_email) {
      alert('Veuillez selectionner ou entrer un sous-traitant');
      return;
    }
    if (!newContract.value || parseFloat(newContract.value) <= 0) {
      alert('Veuillez entrer une valeur valide');
      return;
    }

    let fileUrl = '';
    if (contractFile) {
      const fileName = `${documentType}s/` + Date.now() + '_' + contractFile.name;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, contractFile);
      
      if (uploadError) {
        alert('Erreur upload: ' + uploadError.message);
        return;
      }
      
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }
    }

    const insertData: any = {
      title: newContract.title,
      reference: newContract.reference || `${documentType.toUpperCase()}-${Date.now()}`,
      subcontractor_email: newContract.subcontractor_email,
      subcontractor_name: newContract.subcontractor_name,
      subcontractor_rccm: newContract.subcontractor_rccm,
      subcontractor_idnat: newContract.subcontractor_idnat,
      subcontractor_tax_number: newContract.subcontractor_tax_number,
      subcontractor_province: newContract.subcontractor_province,
      subcontractor_sector: newContract.subcontractor_sector,
      prime_email: primeDetails.email,
      prime_id: auth.userId,
      prime_name: primeDetails.name,
      prime_rccm: primeDetails.rccm,
      prime_idnat: primeDetails.idnat,
      prime_tax_number: primeDetails.tax_number,
      prime_province: primeDetails.province,
      prime_sector: primeDetails.sector,
      value: parseFloat(newContract.value),
      description: newContract.description,
      document_url: fileUrl,
      document_type: documentType,
      status: 'draft',
      progress: 0,
    };

    if (documentType === 'contract') {
      insertData.start_date = newContract.start_date;
      insertData.end_date = newContract.end_date;
    } else {
      insertData.end_date = newContract.delivery_date;
    }

    const { error } = await supabase.from('contracts').insert([insertData]);
    
    if (error) {
      alert('Erreur lors de la creation: ' + error.message);
      return;
    }

    setShowCreate(false);
    setContractFile(null);
    setSelectedSubcontractor(null);
    setSearchQuery('');
    setManualEntry(false);
    setNewContract({
      title: '', reference: '', subcontractor_email: '',
      subcontractor_name: '', subcontractor_rccm: '', subcontractor_idnat: '',
      subcontractor_tax_number: '', subcontractor_province: '', subcontractor_sector: '',
      value: '', start_date: '', end_date: '', delivery_date: '', description: '', items: '',
    });
    fetchContracts();
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

  async function acceptContract(id: string) {
    const { error } = await supabase.from('contracts').update({ status: 'active' }).eq('id', id);
    if (!error) {
      setSelectedContract((prev: any) => ({ ...prev, status: 'active' }));
      fetchContracts();
      alert('Document accepte avec succes!');
    } else {
      alert('Erreur: ' + error.message);
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600', icon: FileText },
    active: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    completed: { label: 'Termine', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    disputed: { label: 'Litige', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    contract: { label: 'Contrat', color: 'bg-[#1a237e] text-white' },
    purchase_order: { label: 'Bon de Commande', color: 'bg-[#FFCD00] text-[#1a237e]' },
  };

  // Render details based on viewer role
  function renderContractDetails(contract: any) {
    const isSubcontractor = auth.userRole === 'subcontractor';
    const isDraft = contract.status === 'draft';
    
    if (isSubcontractor) {
      return (
        <div className="space-y-3">
          <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Reference</span><p className="font-medium text-[#0a2540]">{contract.reference}</p></div>
            <div><span className="text-gray-500">Statut</span><p className="font-medium text-[#0a2540]">{statusConfig[contract.status]?.label || 'Inconnu'}</p></div>
            <div><span className="text-gray-500">Valeur</span><p className="font-medium text-[#0a2540]">USD {contract.value}</p></div>
            <div><span className="text-gray-500">Type</span><p className="font-medium text-[#0a2540]">{typeConfig[contract.document_type]?.label || 'Contrat'}</p></div>
            {contract.start_date && contract.document_type === 'contract' && (
              <div><span className="text-gray-500">Debut</span><p className="font-medium text-[#0a2540]">{contract.start_date}</p></div>
            )}
            {contract.end_date && (
              <div><span className="text-gray-500">{contract.document_type === 'purchase_order' ? 'Livraison' : 'Fin'}</span><p className="font-medium text-[#0a2540]">{contract.end_date}</p></div>
            )}
          </div>

          {/* Prime company details */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-sm font-semibold text-[#1a237e] mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Entreprise mandante (Prime)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-[#0a2540]">{contract.prime_name || 'Non specifie'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {contract.prime_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contract.prime_email}</div>}
                {contract.prime_rccm && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> RCCM: {contract.prime_rccm}</div>}
                {contract.prime_idnat && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> IDNAT: {contract.prime_idnat}</div>}
                {contract.prime_tax_number && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> NIF: {contract.prime_tax_number}</div>}
                {contract.prime_province && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contract.prime_province}</div>}
                {contract.prime_sector && <div className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {contract.prime_sector}</div>}
              </div>
            </div>
          </div>

          {/* Description */}
          {contract.description && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0a2540] mb-1">Description</h4>
              <p className="text-sm text-gray-600">{contract.description}</p>
            </div>
          )}

          {/* PO Items */}
          {contract.items && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0a2540] mb-1">Articles / Services</h4>
              <p className="text-sm text-gray-600">{contract.items}</p>
            </div>
          )}

          {/* Progress for contracts */}
          {contract.document_type === 'contract' && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression du contrat</span>
                <span className="font-medium">{contract.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#007FFF] h-2 rounded-full transition-all" style={{ width: contract.progress + '%' }} />
              </div>
            </div>
          )}

          {/* Accept button - only for draft documents */}
          {isDraft && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-amber-800 mb-3">
                Ce document est en attente de votre approbation. En acceptant, vous confirmez votre engagement.
              </p>
              <button
                onClick={() => {
                  if (confirm('Etes-vous sur de vouloir accepter ce document?')) {
                    acceptContract(contract.id);
                  }
                }}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accepter le {contract.document_type === 'purchase_order' ? 'bon de commande' : 'contrat'}
              </button>
            </div>
          )}

          {/* Already accepted message */}
          {!isDraft && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-800">Document accepte et actif</span>
            </div>
          )}
        </div>
      );
    } else {
      // Prime sees SUBCONTRACTOR details
      return (
        <div className="space-y-3">
          <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Reference</span><p className="font-medium text-[#0a2540]">{contract.reference}</p></div>
            <div><span className="text-gray-500">Statut</span><p className="font-medium text-[#0a2540]">{statusConfig[contract.status]?.label || 'Inconnu'}</p></div>
            <div><span className="text-gray-500">Valeur</span><p className="font-medium text-[#0a2540]">USD {contract.value}</p></div>
            <div><span className="text-gray-500">Sous-traitant</span><p className="font-medium text-[#0a2540]">{contract.subcontractor_name || contract.subcontractor_email}</p></div>
            {contract.start_date && contract.document_type === 'contract' && (
              <div><span className="text-gray-500">Debut</span><p className="font-medium text-[#0a2540]">{contract.start_date}</p></div>
            )}
            {contract.end_date && (
              <div><span className="text-gray-500">{contract.document_type === 'purchase_order' ? 'Livraison' : 'Fin'}</span><p className="font-medium text-[#0a2540]">{contract.end_date}</p></div>
            )}
          </div>

          {/* Subcontractor details */}
          {(contract.subcontractor_rccm || contract.subcontractor_idnat) && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0a2540] mb-2">Details du sous-traitant</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {contract.subcontractor_rccm && <div>RCCM: {contract.subcontractor_rccm}</div>}
                {contract.subcontractor_idnat && <div>IDNAT: {contract.subcontractor_idnat}</div>}
                {contract.subcontractor_tax_number && <div>NIF: {contract.subcontractor_tax_number}</div>}
                {contract.subcontractor_province && <div>Province: {contract.subcontractor_province}</div>}
                {contract.subcontractor_sector && <div>Secteur: {contract.subcontractor_sector}</div>}
              </div>
            </div>
          )}

          {contract.description && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <p className="text-sm text-gray-600">{contract.description}</p>
            </div>
          )}

          {contract.items && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0a2540] mb-1">Articles / Services</h4>
              <p className="text-sm text-gray-600">{contract.items}</p>
            </div>
          )}

          {/* Progress control - only for primes viewing contracts */}
          {contract.document_type === 'contract' && auth.userRole === 'prime' && (
            <div className="bg-[#F6F9FC] rounded-lg p-4">
              <label className="text-sm font-medium text-[#0a2540] mb-2 block">
                Progression: {contract.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={contract.progress}
                onChange={(e) => updateProgress(contract.id, parseInt(e.target.value))}
                className="w-full accent-[#007FFF]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Status control - only for primes */}
          {auth.userRole === 'prime' && (
            <select
              value={contract.status}
              onChange={(e) => updateStatus(contract.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
            >
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
              <option value="completed">Termine</option>
              <option value="disputed">Litige</option>
            </select>
          )}
        </div>
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">
          {auth.userRole === 'subcontractor' ? 'Mes Contrats & Bons de Commande' : 'Gestion des Contrats & Bons de Commande'}
        </h2>
        {auth.userRole === 'prime' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]"
          >
            <Plus className="w-4 h-4" />
            Nouveau document
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {auth.userRole === 'subcontractor' 
              ? 'Aucun contrat ou bon de commande recu' 
              : 'Aucun document disponible'}
          </p>
          {auth.userRole === 'prime' && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">
              Creer le premier document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const status = statusConfig[c.status] || statusConfig.draft;
            const type = typeConfig[c.document_type] || typeConfig.contract;
            const Icon = status.icon;
            
            const counterpartyName = auth.userRole === 'subcontractor' 
              ? (c.prime_name || c.prime_email) 
              : (c.subcontractor_name || c.subcontractor_email);
            
            return (
              <div
                key={c.id}
                onClick={() => setSelectedContract(c)}
                className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-[#0a2540]">{c.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${type.color}`}>
                        {type.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{c.reference}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {c.value && <span className="font-medium">USD {c.value}</span>}
                      <span>{auth.userRole === 'subcontractor' ? 'De' : 'A'}: {counterpartyName}</span>
                      {c.end_date && <span>{c.document_type === 'purchase_order' ? 'Livraison' : 'Fin'}: {c.end_date}</span>}
                    </div>
                  </div>
                  <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
                {c.document_type === 'contract' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#007FFF] h-1.5 rounded-full" style={{ width: c.progress + '%' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && auth.userRole === 'prime' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouveau document</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setDocumentType('contract')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    documentType === 'contract' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Contrat
                </button>
                <button
                  onClick={() => setDocumentType('purchase_order')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    documentType === 'purchase_order' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bon de Commande
                </button>
              </div>

              <div className="space-y-4">
                {primeDetails && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-gray-500 mb-1">Votre entreprise (mandante)</div>
                    <div className="text-sm font-medium text-[#0a2540]">{primeDetails.name}</div>
                    <div className="text-xs text-gray-500">{primeDetails.email}</div>
                  </div>
                )}

                <input 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                  placeholder={documentType === 'contract' ? "Titre du contrat" : "Titre du bon de commande"} 
                  value={newContract.title} 
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })} 
                />

                <input 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                  placeholder="Reference (auto-generee si vide)" 
                  value={newContract.reference} 
                  onChange={(e) => setNewContract({ ...newContract, reference: e.target.value })} 
                />

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500">Sous-traitant</label>
                    <button 
                      onClick={() => { setManualEntry(!manualEntry); clearSubcontractor(); }}
                      className="text-xs text-[#007FFF] hover:underline"
                    >
                      {manualEntry ? 'Rechercher dans le registre' : 'Saisie manuelle'}
                    </button>
                  </div>

                  {!manualEntry ? (
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          className="flex-1 text-sm outline-none"
                          placeholder="Rechercher une entreprise agreee..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchSubcontractors(e.target.value);
                          }}
                        />
                        {selectedSubcontractor && (
                          <button onClick={clearSubcontractor} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {showSearchResults && subcontractors.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {subcontractors.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => selectSubcontractor(sub)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#1a237e]" />
                                <div>
                                  <div className="text-sm font-medium text-[#0a2540]">{sub.name}</div>
                                  <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                                    <span>{sub.sector}</span>
                                    <span>{sub.province}</span>
                                    <span className="text-emerald-600">{sub.congolese_capital}% congolais</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showSearchResults && searchQuery.length >= 2 && subcontractors.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          Aucune entreprise trouvee. <button onClick={() => setManualEntry(true)} className="text-[#007FFF] hover:underline">Saisie manuelle</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                        placeholder="Nom du sous-traitant" 
                        value={newContract.subcontractor_name} 
                        onChange={(e) => setNewContract({ ...newContract, subcontractor_name: e.target.value })} 
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="Email" 
                          value={newContract.subcontractor_email} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_email: e.target.value })} 
                        />
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="RCCM" 
                          value={newContract.subcontractor_rccm} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_rccm: e.target.value })} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="ID National" 
                          value={newContract.subcontractor_idnat} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_idnat: e.target.value })} 
                        />
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="NIF" 
                          value={newContract.subcontractor_tax_number} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_tax_number: e.target.value })} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="Province" 
                          value={newContract.subcontractor_province} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_province: e.target.value })} 
                        />
                        <input 
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                          placeholder="Secteur" 
                          value={newContract.subcontractor_sector} 
                          onChange={(e) => setNewContract({ ...newContract, subcontractor_sector: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}

                  {selectedSubcontractor && !manualEntry && (
                    <div className="mt-2 p-3 bg-[#F6F9FC] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-[#1a237e]" />
                        <span className="text-sm font-medium text-[#0a2540]">{selectedSubcontractor.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedSubcontractor.email}</div>
                        <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> RCCM: {selectedSubcontractor.rccm || 'N/A'}</div>
                        <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> IDNAT: {selectedSubcontractor.id_national || 'N/A'}</div>
                        <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> NIF: {selectedSubcontractor.tax_number || 'N/A'}</div>
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedSubcontractor.province || 'N/A'}</div>
                        <div className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {selectedSubcontractor.sector || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                  placeholder="Valeur USD" 
                  value={newContract.value} 
                  onChange={(e) => setNewContract({ ...newContract, value: e.target.value })} 
                />

                {documentType === 'contract' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Date de debut</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                        value={newContract.start_date} 
                        onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Date de fin</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                        value={newContract.end_date} 
                        onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })} 
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date de livraison / execution</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" 
                      value={newContract.delivery_date} 
                      onChange={(e) => setNewContract({ ...newContract, delivery_date: e.target.value })} 
                    />
                  </div>
                )}

                {documentType === 'purchase_order' && (
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-20 resize-none" 
                    placeholder="Articles / Services commandes (ex: 50 sacs de ciment, transport de materiel...)" 
                    value={newContract.items} 
                    onChange={(e) => setNewContract({ ...newContract, items: e.target.value })} 
                  />
                )}

                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-20 resize-none" 
                  placeholder="Description / Conditions" 
                  value={newContract.description} 
                  onChange={(e) => setNewContract({ ...newContract, description: e.target.value })} 
                />

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Document PDF</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" 
                    onChange={(e) => setContractFile(e.target.files ? e.target.files[0] : null)} 
                  />
                </div>

                <button 
                  onClick={handleCreateContract} 
                  className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC]"
                >
                  Creer le {documentType === 'contract' ? 'contrat' : 'bon de commande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContract(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#0a2540]">{selectedContract.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeConfig[selectedContract.document_type]?.color || typeConfig.contract.color}`}>
                    {typeConfig[selectedContract.document_type]?.label || 'Contrat'}
                  </span>
                </div>
                <button onClick={() => setSelectedContract(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              {renderContractDetails(selectedContract)}

              {docUrl && (
                <a href={docUrl} target="_blank" rel="noopener noreferrer" className="mt-4 w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Telecharger le document
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}