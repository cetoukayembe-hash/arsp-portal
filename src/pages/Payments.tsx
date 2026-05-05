import { useState } from 'react';
import { CreditCard, Building2, CheckCircle2, Download, Smartphone, X } from 'lucide-react';
import { payments } from '@/data/mockData';

export function Payments() {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'history' | 'methods'>('outstanding');
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'mobile' | 'bank' | 'card'>('mobile');
  const [paySuccess, setPaySuccess] = useState(false);

  const outstanding = payments.filter((p) => p.status !== 'paid');
  const history = payments.filter((p) => p.status === 'paid');

  const handlePay = () => {
    setPaySuccess(true);
    setTimeout(() => {
      setPaySuccess(false);
      setShowPayModal(null);
    }, 2000);
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Payé</span>;
    if (status === 'overdue') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">En retard</span>;
    return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">En attente</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Paiements</h2>

      <div className="flex gap-2 mb-6">
        {(['outstanding', 'history', 'methods'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab === 'outstanding' ? 'À payer' : tab === 'history' ? 'Historique' : 'Méthodes'}
          </button>
        ))}
      </div>

      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F9FC]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Montant (CDF)</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Montant (USD)</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Échéance</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {outstanding.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-[#0a2540]">{p.type}</td>
                  <td className="px-4 py-3 text-gray-600">{p.amountCDF.toLocaleString()} CDF</td>
                  <td className="px-4 py-3 text-gray-600">{p.amountUSD} USD</td>
                  <td className="px-4 py-3 text-gray-600">{p.dueDate}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setShowPayModal(p.id)}
                      className="px-3 py-1.5 bg-[#007FFF] text-white rounded-lg text-xs font-medium hover:bg-[#0066CC] transition-colors"
                    >
                      Payer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F9FC]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Montant</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Méthode</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Reçu</th>
                <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-[#0a2540]">{p.type}</td>
                  <td className="px-4 py-3 text-gray-600">{p.amountCDF.toLocaleString()} CDF</td>
                  <td className="px-4 py-3 text-gray-600">{p.paidDate}</td>
                  <td className="px-4 py-3 text-gray-600">{p.method}</td>
                  <td className="px-4 py-3 text-gray-600">{p.receiptNumber}</td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline">
                      <Download className="w-3 h-3" /> Reçu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'methods' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-[#0a2540] mb-1">Mobile Money</h3>
            <p className="text-sm text-gray-600 mb-4">Orange Money, M-Pesa, Airtel Money</p>
            <button className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Configurer
            </button>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-[#0a2540] mb-1">Virement bancaire</h3>
            <p className="text-sm text-gray-600 mb-4">Compte ARSP : RAWBANK 000-123456-78</p>
            <button className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Voir détails
            </button>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-[#0a2540] mb-1">Carte bancaire</h3>
            <p className="text-sm text-gray-600 mb-4">Visa, Mastercard (simulation)</p>
            <button className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Configurer
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {paySuccess ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-[#0a2540] mb-2">Paiement confirmé</h3>
                <p className="text-gray-600 mb-4">Votre transaction a été traitée avec succès.</p>
                <div className="bg-[#F6F9FC] rounded-lg p-4">
                  <p className="text-xs text-gray-500">Numéro de reçu</p>
                  <p className="text-lg font-bold text-[#0a2540]">REC-2026-089</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#0a2540]">Effectuer le paiement</h3>
                  <button onClick={() => setShowPayModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                {(() => {
                  const p = payments.find((x) => x.id === showPayModal);
                  if (!p) return null;
                  return (
                    <div className="space-y-4">
                      <div className="bg-[#F6F9FC] rounded-lg p-4">
                        <p className="text-xs text-gray-500">À payer</p>
                        <p className="text-2xl font-bold text-[#0a2540]">{p.amountCDF.toLocaleString()} CDF</p>
                        <p className="text-sm text-gray-500">≈ {p.amountUSD} USD</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => setPayMethod('mobile')} className={`p-3 rounded-lg border-2 text-center transition-all ${payMethod === 'mobile' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}>
                            <Smartphone className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                            <span className="text-xs">Mobile</span>
                          </button>
                          <button onClick={() => setPayMethod('bank')} className={`p-3 rounded-lg border-2 text-center transition-all ${payMethod === 'bank' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}>
                            <Building2 className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                            <span className="text-xs">Banque</span>
                          </button>
                          <button onClick={() => setPayMethod('card')} className={`p-3 rounded-lg border-2 text-center transition-all ${payMethod === 'card' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}>
                            <CreditCard className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                            <span className="text-xs">Carte</span>
                          </button>
                        </div>
                      </div>
                      {payMethod === 'mobile' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
                          <input type="tel" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="+243 82 ..." defaultValue="+243 824 940 440" />
                        </div>
                      )}
                      {payMethod === 'bank' && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-[#0a2540] mb-1">Compte ARSP – RAWBANK</p>
                          <p className="text-gray-600">IBAN: CD12 0001 2345 6789 0123</p>
                          <p className="text-gray-600">SWIFT: RAWBCDKI</p>
                          <p className="text-xs text-gray-400 mt-2">Veuillez télécharger le justificatif de virement après paiement.</p>
                        </div>
                      )}
                      {payMethod === 'card' && (
                        <div className="space-y-3">
                          <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Numéro de carte" defaultValue="4111 1111 1111 1111" />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="text" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="MM/AA" defaultValue="12/27" />
                            <input type="text" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="CVV" defaultValue="123" />
                          </div>
                        </div>
                      )}
                      <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span className="font-medium">{p.amountCDF.toLocaleString()} CDF</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">TVA (16%)</span><span className="font-medium">{Math.round(p.amountCDF * 0.16).toLocaleString()} CDF</span></div>
                        <div className="flex justify-between text-[#0a2540] font-bold"><span>Total</span><span>{Math.round(p.amountCDF * 1.16).toLocaleString()} CDF</span></div>
                      </div>
                      <button
                        onClick={handlePay}
                        className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-colors"
                      >
                        Confirmer le paiement
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
