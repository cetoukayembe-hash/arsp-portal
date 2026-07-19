import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, Search, FileText, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

interface PaymentTransfer {
  id: string;
  declaration_id: string;
  prime_id: string;
  amount_due: number;
  amount_transferred: number;
  transfer_reference: string;
  transfer_proof_url: string;
  status: 'pending' | 'verified' | 'rejected';
  notes: string;
  created_at: string;
  verified_at: string;
  prime_name?: string;
  month?: string;
  year?: number;
}

export function PaymentVerification() {
  const auth = useAuth();
  const [transfers, setTransfers] = useState<PaymentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPrime, setFilterPrime] = useState('all');
  const [selectedTransfer, setSelectedTransfer] = useState<PaymentTransfer | null>(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  async function fetchTransfers() {
    setLoading(true);
    try {
      // Fetch transfers without join (avoid FK issues)
      const { data: trData, error: trError } = await supabase
        .from('payment_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (trError) throw trError;

      // Fetch declarations separately to get prime names
      const { data: decData, error: decError } = await supabase
        .from('declarations')
        .select('id, prime_name, month, year');

      if (decError) throw decError;

      // Map them together manually
      const decMap = new Map((decData || []).map((d: any) => [d.id, d]));
      const formatted = (trData || []).map((t: any) => {
        const dec = decMap.get(t.declaration_id);
        return {
          ...t,
          prime_name: dec?.prime_name,
          month: dec?.month,
          year: dec?.year,
        };
      });

      setTransfers(formatted);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleVerify(transferId: string, status: 'verified' | 'rejected') {
    setProcessing(true);
    try {
      const { error: transferError } = await supabase
        .from('payment_transfers')
        .update({
          status,
          verified_at: new Date().toISOString(),
          verified_by: auth.userId,
          notes: verifyNote,
        })
        .eq('id', transferId);

      if (transferError) throw transferError;

      const transfer = transfers.find(t => t.id === transferId);
      if (transfer) {
        await supabase
          .from('declarations')
          .update({ payment_status: status === 'verified' ? 'verified' : 'unpaid' })
          .eq('id', transfer.declaration_id);
      }

      if (status === 'verified') {
        const receiptNumber = `ARSP-${new Date().getFullYear()}-${String(transfers.length + 1).padStart(5, '0')}`;
        await supabase.from('receipts').insert([{
          transfer_id: transferId,
          receipt_number: receiptNumber,
          amount: transfer?.amount_transferred || transfer?.amount_due,
        }]);
      }

      showToast(status === 'verified' ? 'Paiement verifie' : 'Paiement rejete', 'success');
      setSelectedTransfer(null);
      setVerifyNote('');
      fetchTransfers();
    } catch (err) {
      console.error('Error verifying:', err);
      showToast('Erreur lors de la verification', 'error');
    } finally {
      setProcessing(false);
    }
  }


  function exportToExcel() {
    const data = filteredTransfers.map(t => ({
      'Entreprise': t.prime_name || '',
      'Periode': t.month + ' ' + t.year || '',
      'Montant du': t.amount_due,
      'Montant vire': t.amount_transferred,
      'Reference': t.transfer_reference,
      'Statut': t.status === 'pending' ? 'En attente' : t.status === 'verified' ? 'Verifie' : 'Rejete',
      'Date soumission': new Date(t.created_at).toLocaleDateString('fr-FR'),
      'Date verification': t.verified_at ? new Date(t.verified_at).toLocaleDateString('fr-FR') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Paiements ARSP');
    XLSX.writeFile(wb, 'ARSP_paiements_' + new Date().toISOString().slice(0,10) + '.xlsx');
  }

  const uniquePrimes = Array.from(new Set(transfers.map(t => t.prime_name).filter(Boolean)));

  const filteredTransfers = transfers.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterMonth !== 'all' && t.month !== filterMonth) return false;
    if (filterYear !== 'all' && t.year?.toString() !== filterYear) return false;
    if (filterPrime !== 'all' && t.prime_name !== filterPrime) return false;
    if (searchQuery && !t.prime_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !t.transfer_reference?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    verified: { label: 'Verifie', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    rejected: { label: 'Rejete', color: 'bg-red-100 text-red-700', icon: XCircle },
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
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#007FFF] text-white flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">Verification des Paiements</h2>
          <p className="text-sm text-gray-500">Valider les virements ARSP des entreprises</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-2xl font-bold text-amber-700">{transfers.filter(t => t.status === 'pending').length}</p>
          <p className="text-sm text-amber-600">En attente</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-2xl font-bold text-emerald-700">{transfers.filter(t => t.status === 'verified').length}</p>
          <p className="text-sm text-emerald-600">Verifies</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">
            {transfers.filter(t => t.status === 'verified').reduce((sum, t) => sum + (t.amount_transferred || 0), 0).toLocaleString('fr-FR')} $
          </p>
          <p className="text-sm text-blue-600">Total collecte</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher entreprise ou reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="verified">Verifies</option>
          <option value="rejected">Rejetes</option>
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
        >
          <option value="all">Tous les mois</option>
          <option value="Janvier">Janvier</option>
          <option value="Fevrier">Fevrier</option>
          <option value="Mars">Mars</option>
          <option value="Avril">Avril</option>
          <option value="Mai">Mai</option>
          <option value="Juin">Juin</option>
          <option value="Juillet">Juillet</option>
          <option value="Aout">Aout</option>
          <option value="Septembre">Septembre</option>
          <option value="Octobre">Octobre</option>
          <option value="Novembre">Novembre</option>
          <option value="Decembre">Decembre</option>
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
        >
          <option value="all">Toutes les annees</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
        <select
          value={filterPrime}
          onChange={(e) => setFilterPrime(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] min-w-[180px]"
        >
          <option value="all">Toutes les entreprises</option>
          {uniquePrimes.map(prime => (
            <option key={prime} value={prime}>{prime}</option>
          ))}
        </select>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Entreprise</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Periode</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Aucun virement trouve
                </td>
              </tr>
            ) : (
              filteredTransfers.map((tr) => {
                const StatusIcon = statusConfig[tr.status].icon;
                return (
                  <tr key={tr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0a2540]">{tr.prime_name || '—'}</td>
                    <td className="px-4 py-3">{tr.month} {tr.year}</td>
                    <td className="px-4 py-3">{tr.amount_transferred?.toLocaleString('fr-FR') || tr.amount_due?.toLocaleString('fr-FR')} $</td>
                    <td className="px-4 py-3 font-mono text-xs">{tr.transfer_reference}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[tr.status].color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusConfig[tr.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedTransfer(tr)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-[#007FFF]"
                        title="Voir details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTransfer(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0a2540]">Details du virement</h3>
              <button onClick={() => setSelectedTransfer(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <span className="text-2xl text-gray-400">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Entreprise</p>
                  <p className="font-medium text-[#0a2540]">{selectedTransfer.prime_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Periode</p>
                  <p className="font-medium text-[#0a2540]">{selectedTransfer.month} {selectedTransfer.year}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Montant du</p>
                  <p className="font-medium text-[#007FFF]">{selectedTransfer.amount_due?.toLocaleString('fr-FR')} $</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Montant vire</p>
                  <p className="font-medium text-[#0a2540]">{selectedTransfer.amount_transferred?.toLocaleString('fr-FR')} $</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Reference bancaire</p>
                <p className="font-mono text-sm bg-gray-100 rounded-lg p-2">{selectedTransfer.transfer_reference}</p>
              </div>

              {selectedTransfer.transfer_proof_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Preuve de virement</p>
                  <a
                    href={selectedTransfer.transfer_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Voir le document
                  </a>
                </div>
              )}

              {selectedTransfer.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
                    <textarea
                      value={verifyNote}
                      onChange={(e) => setVerifyNote(e.target.value)}
                      placeholder="Observation sur le virement..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleVerify(selectedTransfer.id, 'verified')}
                      disabled={processing}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {processing ? 'Traitement...' : 'Verifier le paiement'}
                    </button>
                    <button
                      onClick={() => handleVerify(selectedTransfer.id, 'rejected')}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  </div>
                </>
              )}

              {selectedTransfer.status !== 'pending' && selectedTransfer.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Note</p>
                  <p className="text-sm text-gray-700">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}