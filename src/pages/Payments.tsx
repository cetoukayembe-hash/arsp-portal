import { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Clock, AlertTriangle, Download, FileText, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

interface Declaration {
  id: string;
  period: string;
  total_amount: number;
  amount_due: number;
  payment_status: 'unpaid' | 'pending_verification' | 'verified' | 'overdue';
  created_at: string;
}

interface Transfer {
  id: string;
  declaration_id: string;
  amount_due: number;
  amount_transferred: number;
  transfer_reference: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export function Payments() {
  const auth = useAuth();
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch unpaid declarations for this prime
      const { data: decData, error: decError } = await supabase
        .from('declarations')
        .select('id, period, total_amount, amount_due, payment_status, created_at')
        .eq('prime_email', auth.userEmail)
        .in('payment_status', ['unpaid', 'overdue'])
        .order('created_at', { ascending: false });

      if (decError) throw decError;
      setDeclarations(decData || []);

      // Fetch transfer history
      const { data: trData, error: trError } = await supabase
        .from('payment_transfers')
        .select('id, declaration_id, amount_due, amount_transferred, transfer_reference, status, created_at')
        .eq('prime_id', auth.userId)
        .order('created_at', { ascending: false });

      if (trError) throw trError;
      setTransfers(trData || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmitTransfer() {
    if (!selectedDeclaration || !uploadFile || !transferRef) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Upload proof file
      const fileName = `transfer-${selectedDeclaration.id}-${Date.now()}.${uploadFile.name.split('.').pop()}`;
      const { error: upError } = await supabase.storage
        .from('transfer_proofs')
        .upload(fileName, uploadFile);

      if (upError) throw upError;

      const { data: urlData } = supabase.storage
        .from('transfer_proofs')
        .getPublicUrl(fileName);

      // Create transfer record
      const { error: insertError } = await supabase.from('payment_transfers').insert([{
        declaration_id: selectedDeclaration.id,
        prime_id: auth.userId,
        amount_due: selectedDeclaration.amount_due,
        amount_transferred: parseFloat(transferAmount) || selectedDeclaration.amount_due,
        transfer_reference: transferRef,
        transfer_proof_url: urlData.publicUrl,
        status: 'pending',
      }]);

      if (insertError) throw insertError;

      // Update declaration status
      await supabase.from('declarations')
        .update({ payment_status: 'pending_verification' })
        .eq('id', selectedDeclaration.id);

      showToast('Preuve de virement soumise avec succes', 'success');
      setSelectedDeclaration(null);
      setTransferRef('');
      setTransferAmount('');
      setUploadFile(null);
      fetchData();
    } catch (err) {
      console.error('Error submitting transfer:', err);
      showToast('Erreur lors de la soumission', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const statusConfig = {
    unpaid: { label: 'Non paye', color: 'bg-amber-100 text-amber-700', icon: Clock },
    pending_verification: { label: 'En attente de verification', color: 'bg-blue-100 text-blue-700', icon: Clock },
    verified: { label: 'Verifie', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#007FFF]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#007FFF] text-white flex items-center justify-center">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">Paiements ARSP</h2>
          <p className="text-sm text-gray-500">Redevance de 1.2% sur les paiements aux sous-traitants</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Apres avoir declare vos paiements aux sous-traitants, vous devez verser 
          <strong> 1.2% du montant total</strong> a l'ARSP via virement bancaire. 
          Uploadez votre preuve de virement ci-dessous.
        </p>
      </div>

      {/* Pending declarations */}
      <div>
        <h3 className="text-lg font-semibold text-[#0a2540] mb-4">Declarations en attente de paiement</h3>
        {declarations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun paiement en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {declarations.map((dec) => {
              const StatusIcon = statusConfig[dec.payment_status].icon;
              return (
                <div key={dec.id} className="bg-white rounded-xl p-5 border hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-[#0a2540]">Declaration {dec.period}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[dec.payment_status].color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusConfig[dec.payment_status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Montant total declare: <strong>{dec.total_amount?.toLocaleString('fr-FR')} $</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Montant du a l'ARSP (1.2%): <strong className="text-[#007FFF]">{dec.amount_due?.toLocaleString('fr-FR')} $</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDeclaration(dec)}
                      className="px-4 py-2 bg-[#007FFF] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Payer <ChevronRight className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer history */}
      {transfers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#0a2540] mb-4">Historique des virements</h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{tr.transfer_reference}</td>
                    <td className="px-4 py-3">{tr.amount_transferred?.toLocaleString('fr-FR')} $</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[tr.status].color}`}>
                        {statusConfig[tr.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(tr.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Transfer Modal */}
      {selectedDeclaration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDeclaration(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0a2540]">Soumettre le virement</h3>
              <button onClick={() => setSelectedDeclaration(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="text-2xl text-gray-400">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Montant a payer: <strong className="text-lg">{selectedDeclaration.amount_due?.toLocaleString('fr-FR')} $</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">Declaration: {selectedDeclaration.period}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference du virement bancaire</label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="Ex: VIR-2026-001234"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant vire (laissez vide si identique)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={selectedDeclaration.amount_due?.toString()}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preuve de virement (PDF ou image)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="transfer-proof"
                  />
                  <label htmlFor="transfer-proof" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadFile ? uploadFile.name : 'Cliquez pour uploader le reçu de virement'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (max 5MB)</p>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSubmitTransfer}
                disabled={submitting || !transferRef || !uploadFile}
                className="w-full py-3 bg-[#007FFF] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Soumission en cours...' : 'Soumettre pour verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}