import { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Download, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function Payments() {
  const auth = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [payMethod, setPayMethod] = useState<'bank' | 'card'>('bank');
  const [paySuccess, setPaySuccess] = useState(false);
  const [newPayment, setNewPayment] = useState({
    description: '', amount: '', due_date: '', payer_name: '', payer_email: '',
  });

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  }

  async function handleCreatePayment() {
    const { error } = await supabase.from('payments').insert([{
      reference: 'PAY-' + Date.now(),
      description: newPayment.description,
      amount: parseFloat(newPayment.amount),
      currency: 'USD',
      status: 'pending',
      payer_name: newPayment.payer_name,
      payer_email: newPayment.payer_email,
      due_date: newPayment.due_date,
    }]);
    if (!error) {
      setShowNew(false);
      setNewPayment({ description: '', amount: '', due_date: '', payer_name: '', payer_email: '' });
      fetchPayments();
    }
  }

  async function handlePay(payment: any) {
    const receiptNumber = 'REC-' + Date.now();
    const { error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        method: payMethod,
        paid_date: new Date().toISOString().split('T')[0],
        receipt_number: receiptNumber,
      })
      .eq('id', payment.id);
    if (!error) {
      setPaySuccess(true);
      setTimeout(() => {
        setShowPay(null);
        setPaySuccess(false);
        fetchPayments();
      }, 2000);
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    paid: { label: 'Paye', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    overdue: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };

  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">
          {auth.userRole === 'admin' ? 'Gestion des Paiements' : 'Mes Paiements'}
        </h2>
        {auth.userRole === 'admin' && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]"
          >
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="text-sm text-gray-500 mb-1">Total en attente</div>
          <div className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'pending').length} facture(s)</div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="text-sm text-gray-500 mb-1">Total paye</div>
          <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'paid').length} paiement(s)</div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="text-sm text-gray-500 mb-1">Total factures</div>
          <div className="text-2xl font-bold text-[#0a2540]">${(totalPending + totalPaid).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{payments.length} facture(s) au total</div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun paiement disponible</p>
          {auth.userRole === 'admin' && (
            <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">
              Creer une premiere facture
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => {
            const status = statusConfig[p.status] || statusConfig.pending;
            const Icon = status.icon;
            return (
              <div key={p.id} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-[#0a2540]">{p.description}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{p.reference}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>💰 ${p.amount?.toLocaleString()} {p.currency}</span>
                      {p.due_date && <span>📅 Echeance: {p.due_date}</span>}
                      {p.payer_name && <span>👤 {p.payer_name}</span>}
                      {p.method && <span>💳 {p.method === 'bank' ? 'Virement bancaire' : 'Carte'}</span>}
                      {p.paid_date && <span>✅ Paye le: {p.paid_date}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Icon className="w-5 h-5 text-gray-400" />
                    {p.status === 'pending' && auth.userRole === 'prime' && (
                      <button
                        onClick={() => setShowPay(p)}
                        className="px-3 py-1.5 bg-[#007FFF] text-white rounded-lg text-xs font-medium hover:bg-[#0066CC]"
                      >
                        Payer
                      </button>
                    )}
                    {p.status === 'paid' && p.receipt_number && (
                      <button className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline">
                        <Download className="w-3 h-3" />
                        Recu
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Payment Modal - Admin only */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouvelle facture</h3>
                <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Description *" value={newPayment.description} onChange={(e) => setNewPayment({...newPayment, description: e.target.value})} />
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Nom du payeur" value={newPayment.payer_name} onChange={(e) => setNewPayment({...newPayment, payer_name: e.target.value})} />
                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Email du payeur" value={newPayment.payer_email} onChange={(e) => setNewPayment({...newPayment, payer_email: e.target.value})} />
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Montant (USD) *" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date d'echeance</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newPayment.due_date} onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})} />
                </div>
                <button onClick={handleCreatePayment} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC]">
                  Creer la facture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal - Prime only */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPay(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Effectuer un paiement</h3>
                <button onClick={() => setShowPay(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              {paySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-[#0a2540] mb-2">Paiement effectue!</h4>
                  <p className="text-gray-500 text-sm">Votre recu sera disponible dans quelques instants.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#F6F9FC] rounded-lg p-4">
                    <p className="text-sm text-gray-500">Montant a payer</p>
                    <p className="text-2xl font-bold text-[#0a2540]">${showPay.amount?.toLocaleString()} USD</p>
                    <p className="text-xs text-gray-400">{showPay.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Methode de paiement</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPayMethod('bank')}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${payMethod === 'bank' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="text-xl mb-1">🏦</div>
                        <div className="text-sm font-medium text-[#0a2540]">Virement bancaire</div>
                        <div className="text-xs text-gray-400">2-3 jours ouvrables</div>
                      </button>
                      <button
                        onClick={() => setPayMethod('card')}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${payMethod === 'card' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="text-xl mb-1">💳</div>
                        <div className="text-sm font-medium text-[#0a2540]">Carte bancaire</div>
                        <div className="text-xs text-gray-400">Immediat</div>
                      </button>
                    </div>
                  </div>

                  {payMethod === 'bank' && (
                    <div className="bg-[#F6F9FC] rounded-lg p-4 text-sm">
                      <p className="font-medium text-[#0a2540] mb-2">Coordonnees bancaires ARSP</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between"><span>Banque:</span><span className="font-medium">Rawbank RDC</span></div>
                        <div className="flex justify-between"><span>Compte:</span><span className="font-medium">0001-2345-6789</span></div>
                        <div className="flex justify-between"><span>Reference:</span><span className="font-medium">{showPay.reference}</span></div>
                      </div>
                    </div>
                  )}

                  {payMethod === 'card' && (
                    <div className="space-y-3">
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Numero de carte" maxLength={19} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="MM/AA" maxLength={5} />
                        <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="CVV" maxLength={3} />
                      </div>
                      <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Nom sur la carte" />
                    </div>
                  )}

                  <button
                    onClick={() => handlePay(showPay)}
                    className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f]"
                  >
                    Confirmer le paiement de ${showPay.amount?.toLocaleString()} USD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}