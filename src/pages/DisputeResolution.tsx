import { useState } from 'react';
import { Gavel, Plus, X, FileText, Send, CheckCircle2, Clock, ChevronRight, Upload, Scale } from 'lucide-react';
import { disputes, contracts, enterprises } from '@/data/mockData';

export function DisputeResolution() {
  const [filter, setFilter] = useState<'all' | 'open' | 'under_review' | 'mediation' | 'resolved' | 'closed'>('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [disputeTab, setDisputeTab] = useState<'dossier' | 'messages' | 'propositions' | 'decision'>('dossier');

  const filtered = disputes.filter((d) => filter === 'all' || d.status === filter);

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: 'Ouvert', color: 'bg-gray-100 text-gray-700' },
    under_review: { label: 'En examen', color: 'bg-blue-100 text-blue-700' },
    mediation: { label: 'Médiation', color: 'bg-amber-100 text-amber-700' },
    resolved: { label: 'Résolu', color: 'bg-emerald-100 text-emerald-700' },
    closed: { label: 'Clôturé', color: 'bg-gray-100 text-gray-500' },
  };

  const getEnterpriseName = (id: string) => enterprises.find((e) => e.id === id)?.name || id;
  const getContractRef = (id: string) => contracts.find((c) => c.id === id)?.reference || id;

  const timelineSteps = ['open', 'under_review', 'mediation', 'resolved', 'closed'];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Résolution des Litiges</h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-[#0a2540] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : f === 'under_review' ? 'En examen' : f === 'mediation' ? 'Médiation' : f === 'resolved' ? 'Résolus' : 'Clôturés'}
          </button>
        ))}
      </div>

      {/* Case List */}
      <div className="space-y-3 mb-6">
        {filtered.map((d) => {
          const cfg = statusConfig[d.status];
          return (
            <div
              key={d.id}
              onClick={() => setSelectedDispute(d.id)}
              className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Gavel className="w-4 h-4 text-[#007FFF]" />
                    <span className="text-sm font-semibold text-[#0a2540]">{d.caseNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{d.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{getContractRef(d.contractId)}</span>
                    <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{getEnterpriseName(d.plaintiffId)} vs {getEnterpriseName(d.defendantId)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ouvert le {d.openedDate}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 hidden md:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* New Dispute Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouveau litige</h3>
                <button onClick={() => setShowNew(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contrat concerné</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>Sélectionner un contrat</option>
                    {contracts.map((c) => (<option key={c.id} value={c.id}>{c.reference} – {c.title}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>Paiement</option>
                    <option>Qualité</option>
                    <option>Délai</option>
                    <option>Non-respect des termes</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24 resize-none" placeholder="Décrivez le litige en détail..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pièces justificatives</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#007FFF] transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Glisser-déposer ou cliquer</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue souhaitée</label>
                  <div className="flex flex-wrap gap-2">
                    {['Médiation', 'Arbitrage', 'Résiliation', 'Dommages et intérêts'].map((opt) => (
                      <button key={opt} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">{opt}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowNew(false)} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-colors">
                  Soumettre le litige
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Detail */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDispute(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const d = disputes.find((x) => x.id === selectedDispute);
              if (!d) return null;
              const currentStepIndex = timelineSteps.indexOf(d.status);
              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0a2540]">{d.caseNumber}</h3>
                      <p className="text-sm text-gray-500">{getContractRef(d.contractId)}</p>
                    </div>
                    <button onClick={() => setSelectedDispute(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center mb-6 overflow-x-auto pb-2">
                    {timelineSteps.map((step, i) => {
                      const isPast = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step} className="flex items-center shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrent ? 'bg-[#007FFF] text-white' : isPast ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {isPast && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <div className="ml-2 mr-4 text-xs">
                            <div className={`font-medium ${isCurrent ? 'text-[#007FFF]' : isPast ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {step === 'open' ? 'Ouvert' : step === 'under_review' ? 'Examen' : step === 'mediation' ? 'Médiation' : step === 'resolved' ? 'Résolution' : 'Clôturé'}
                            </div>
                            {isPast && <div className="text-gray-400">{d.openedDate}</div>}
                          </div>
                          {i < timelineSteps.length - 1 && (
                            <div className={`w-8 h-0.5 mr-4 ${isPast && i < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
                    {(['dossier', 'messages', 'propositions', 'decision'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDisputeTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          disputeTab === tab ? 'bg-[#0a2540] text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {tab === 'dossier' ? 'Dossier' : tab === 'messages' ? 'Messages' : tab === 'propositions' ? 'Propositions' : 'Décision'}
                      </button>
                    ))}
                  </div>

                  {disputeTab === 'dossier' && (
                    <div className="space-y-4">
                      <div className="bg-[#F6F9FC] rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Description du litige</h4>
                        <p className="text-sm text-gray-600">{d.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F6F9FC] rounded-lg p-3">
                          <div className="text-xs text-gray-500">Plaignant</div>
                          <div className="text-sm font-medium text-[#0a2540]">{getEnterpriseName(d.plaintiffId)}</div>
                        </div>
                        <div className="bg-[#F6F9FC] rounded-lg p-3">
                          <div className="text-xs text-gray-500">Défendeur</div>
                          <div className="text-sm font-medium text-[#0a2540]">{getEnterpriseName(d.defendantId)}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Éléments de preuve</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">facture_retard.pdf</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">releve_paiements.xlsx</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {disputeTab === 'messages' && (
                    <div className="space-y-3 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold shrink-0">AR</div>
                        <div className="bg-white rounded-lg p-3 text-sm shadow-sm">
                          <p className="text-gray-700">Bonjour, nous avons reçu votre dossier de litige. Un médiateur ARSP vous sera assigné sous 48h.</p>
                          <span className="text-[10px] text-gray-400">ARSP – 16/08/2025 09:30</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">ML</div>
                        <div className="bg-blue-500 text-white rounded-lg p-3 text-sm shadow-sm">
                          <p>Merci pour votre retour. Nous restons à votre disposition pour fournir tous les documents nécessaires.</p>
                          <span className="text-[10px] text-blue-100">Plaignant – 16/08/2025 10:15</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="text" placeholder="Écrire un message..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        <button className="p-2 bg-[#007FFF] text-white rounded-lg hover:bg-[#0066CC]"><Send className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}

                  {disputeTab === 'propositions' && (
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[#0a2540]">Proposition de règlement #1</span>
                          <span className="text-xs text-gray-500">18/08/2025</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Paiement échelonné sur 3 mois des factures en retard avec intérêts de 2%.</p>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600">Accepter</button>
                          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Contre-proposition</button>
                          <button className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50">Refuser</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {disputeTab === 'decision' && (
                    <div className="text-center py-8">
                      {d.status === 'resolved' ? (
                        <div>
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                          <h4 className="text-lg font-semibold text-[#0a2540] mb-2">Litige résolu</h4>
                          <p className="text-sm text-gray-600 max-w-md mx-auto">
                            Le médiateur ARSP a rendu sa décision le 15/10/2025. Les parties ont accepté les termes du règlement.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                          <h4 className="text-lg font-semibold text-[#0a2540] mb-2">Décision en attente</h4>
                          <p className="text-sm text-gray-600 max-w-md mx-auto">
                            Le dossier est actuellement en {statusConfig[d.status].label.toLowerCase()}. Une décision sera rendue sous 30 jours ouvrables.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
