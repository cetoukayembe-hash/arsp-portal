import { useState, useEffect } from 'react';
import { X, CheckCircle2, FileText, AlertTriangle, Clock, Download, Building2, Mail, Hash, MapPin, Briefcase, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

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

interface ContractDetailModalProps {
  contract: any;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ContractDetailModal({ contract, onClose, onUpdate }: ContractDetailModalProps) {
  const auth = useAuth();
  const [docUrl, setDocUrl] = useState('');
  const [localContract, setLocalContract] = useState(contract);

  useEffect(() => {
    setLocalContract(contract);
    setDocUrl(contract?.document_url || '');
  }, [contract]);

  if (!contract) return null;

  const isSubcontractor = auth.userRole === 'subcontractor';
  const isDraft = localContract.status === 'draft';

  async function updateProgress(progress: number) {
    const { error } = await supabase.from('contracts').update({ progress }).eq('id', localContract.id);
    if (!error) {
      setLocalContract((prev: any) => ({ ...prev, progress }));
      if (onUpdate) onUpdate();
    }
  }

  async function updateStatus(status: string) {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', localContract.id);
    if (!error) {
      setLocalContract((prev: any) => ({ ...prev, status }));
      if (onUpdate) onUpdate();
    }
  }

  async function acceptContract() {
    const { error } = await supabase.from('contracts').update({ status: 'active' }).eq('id', localContract.id);
    if (!error) {
      setLocalContract((prev: any) => ({ ...prev, status: 'active' }));
      if (onUpdate) onUpdate();
      alert('Document accepte avec succes!');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#0a2540]">{localContract.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeConfig[localContract.document_type]?.color || typeConfig.contract.color}`}>
                {typeConfig[localContract.document_type]?.label || 'Contrat'}
              </span>
            </div>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          {isSubcontractor ? (
            // Subcontractor sees PRIME details
            <div className="space-y-3">
              <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Reference</span><p className="font-medium text-[#0a2540]">{localContract.reference}</p></div>
                <div><span className="text-gray-500">Statut</span><p className="font-medium text-[#0a2540]">{statusConfig[localContract.status]?.label || 'Inconnu'}</p></div>
                <div><span className="text-gray-500">Valeur</span><p className="font-medium text-[#0a2540]">USD {localContract.value}</p></div>
                <div><span className="text-gray-500">Type</span><p className="font-medium text-[#0a2540]">{typeConfig[localContract.document_type]?.label || 'Contrat'}</p></div>
                {localContract.start_date && localContract.document_type === 'contract' && (
                  <div><span className="text-gray-500">Debut</span><p className="font-medium text-[#0a2540]">{localContract.start_date}</p></div>
                )}
                {localContract.end_date && (
                  <div><span className="text-gray-500">{localContract.document_type === 'purchase_order' ? 'Livraison' : 'Fin'}</span><p className="font-medium text-[#0a2540]">{localContract.end_date}</p></div>
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
                    <span className="font-medium text-[#0a2540]">{localContract.prime_name || 'Non specifie'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {localContract.prime_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {localContract.prime_email}</div>}
                    {localContract.prime_rccm && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> RCCM: {localContract.prime_rccm}</div>}
                    {localContract.prime_idnat && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> IDNAT: {localContract.prime_idnat}</div>}
                    {localContract.prime_tax_number && <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> NIF: {localContract.prime_tax_number}</div>}
                    {localContract.prime_province && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {localContract.prime_province}</div>}
                    {localContract.prime_sector && <div className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {localContract.prime_sector}</div>}
                  </div>
                </div>
              </div>

              {localContract.description && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#0a2540] mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{localContract.description}</p>
                </div>
              )}

              {localContract.items && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#0a2540] mb-1">Articles / Services</h4>
                  <p className="text-sm text-gray-600">{localContract.items}</p>
                </div>
              )}

              {localContract.document_type === 'contract' && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression du contrat</span>
                    <span className="font-medium">{localContract.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#007FFF] h-2 rounded-full transition-all" style={{ width: localContract.progress + '%' }} />
                  </div>
                </div>
              )}

              {isDraft && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-800 mb-3">
                    Ce document est en attente de votre approbation. En acceptant, vous confirmez votre engagement.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Etes-vous sur de vouloir accepter ce document?')) {
                        acceptContract();
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accepter le {localContract.document_type === 'purchase_order' ? 'bon de commande' : 'contrat'}
                  </button>
                </div>
              )}

              {!isDraft && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-emerald-800">Document accepte et actif</span>
                </div>
              )}
            </div>
          ) : (
            // Prime sees SUBCONTRACTOR details
            <div className="space-y-3">
              <div className="bg-[#F6F9FC] rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Reference</span><p className="font-medium text-[#0a2540]">{localContract.reference}</p></div>
                <div><span className="text-gray-500">Statut</span><p className="font-medium text-[#0a2540]">{statusConfig[localContract.status]?.label || 'Inconnu'}</p></div>
                <div><span className="text-gray-500">Valeur</span><p className="font-medium text-[#0a2540]">USD {localContract.value}</p></div>
                <div><span className="text-gray-500">Sous-traitant</span><p className="font-medium text-[#0a2540]">{localContract.subcontractor_name || localContract.subcontractor_email}</p></div>
                {localContract.start_date && localContract.document_type === 'contract' && (
                  <div><span className="text-gray-500">Debut</span><p className="font-medium text-[#0a2540]">{localContract.start_date}</p></div>
                )}
                {localContract.end_date && (
                  <div><span className="text-gray-500">{localContract.document_type === 'purchase_order' ? 'Livraison' : 'Fin'}</span><p className="font-medium text-[#0a2540]">{localContract.end_date}</p></div>
                )}
              </div>

              {(localContract.subcontractor_rccm || localContract.subcontractor_idnat) && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#0a2540] mb-2">Details du sous-traitant</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {localContract.subcontractor_rccm && <div>RCCM: {localContract.subcontractor_rccm}</div>}
                    {localContract.subcontractor_idnat && <div>IDNAT: {localContract.subcontractor_idnat}</div>}
                    {localContract.subcontractor_tax_number && <div>NIF: {localContract.subcontractor_tax_number}</div>}
                    {localContract.subcontractor_province && <div>Province: {localContract.subcontractor_province}</div>}
                    {localContract.subcontractor_sector && <div>Secteur: {localContract.subcontractor_sector}</div>}
                  </div>
                </div>
              )}

              {localContract.description && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <p className="text-sm text-gray-600">{localContract.description}</p>
                </div>
              )}

              {localContract.items && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#0a2540] mb-1">Articles / Services</h4>
                  <p className="text-sm text-gray-600">{localContract.items}</p>
                </div>
              )}

              {localContract.document_type === 'contract' && auth.userRole === 'prime' && (
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <label className="text-sm font-medium text-[#0a2540] mb-2 block">
                    Progression: {localContract.progress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localContract.progress}
                    onChange={(e) => updateProgress(parseInt(e.target.value))}
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
                  value={localContract.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                >
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="completed">Termine</option>
                  <option value="disputed">Litige</option>
                </select>
              )}
            </div>
          )}

          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="mt-4 w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Telecharger le document
            </a>
          )}
        </div>
      </div>
    </div>
  );
}