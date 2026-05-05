import { useState } from 'react';
import { Zap, MapPin, Users, Star, ChevronRight, Save, ThumbsDown, SlidersHorizontal } from 'lucide-react';
import { tenders } from '@/data/mockData';

export function SmartMatching() {
  const [weights, setWeights] = useState({ sector: 80, capacity: 60, location: 70, history: 40 });

  const matches = tenders.slice(0, 5).map((t, i) => {
    const scores = [
      t.sector === 'Construction' ? weights.sector : t.sector === 'IT' ? weights.sector * 0.7 : weights.sector * 0.3,
      t.applicantsCount < 5 ? weights.capacity : weights.capacity * 0.6,
      t.province === 'Kinshasa' ? weights.location : weights.location * 0.5,
      i % 2 === 0 ? weights.history : weights.history * 0.8,
    ];
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { ...t, matchScore: Math.min(98, Math.max(60, avg)), breakdown: scores };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-2">Matching Intelligent</h2>
      <p className="text-gray-600 mb-6">Opportunités recommandées pour votre profil d'entreprise</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Criteria Panel */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl p-5 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-5 h-5 text-[#007FFF]" />
              <h3 className="font-semibold text-[#0a2540]">Critères de matching</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'sector', label: "Secteur d'activité" },
                { key: 'capacity', label: 'Capacité financière' },
                { key: 'location', label: 'Localisation géographique' },
                { key: 'history', label: 'Historique de performance' },
              ].map((w) => (
                <div key={w.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{w.label}</span>
                    <span className="font-bold text-[#0a2540]">{(weights as any)[w.key]}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={(weights as any)[w.key]}
                    onChange={(e) => setWeights({ ...weights, [w.key]: parseInt(e.target.value) })}
                    className="w-full accent-[#007FFF]"
                  />
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Lancer la recherche
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mt-4 border border-blue-100">
            <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Votre profil</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Secteur</span><span className="font-medium text-[#0a2540]">Construction</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Province</span><span className="font-medium text-[#0a2540]">Kinshasa</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Employés</span><span className="font-medium text-[#0a2540]">45</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Score conformité</span><span className="font-medium text-[#0a2540]">92%</span></div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          {matches.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="shrink-0 flex flex-col items-center justify-center w-20">
                  <div className={`text-3xl font-bold ${m.matchScore >= 85 ? 'text-emerald-600' : m.matchScore >= 70 ? 'text-[#007FFF]' : 'text-amber-600'}`}>
                    {m.matchScore}%
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">compatibilité</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#0a2540]">{m.title}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{m.sector}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{m.reference}</p>
                  <p className="text-sm text-gray-600 mb-3">{m.description}</p>

                  {/* Breakdown bars */}
                  <div className="flex gap-2 mb-3">
                    {m.breakdown.map((score, i) => (
                      <div key={i} className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                          <div className="bg-[#007FFF] h-1.5 rounded-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{['Secteur', 'Capacité', 'Localisation', 'Historique'][i]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.province}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.applicantsCount} candidats</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{m.estimatedValue}</span>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[#0a2540] text-white rounded-lg text-xs font-medium hover:bg-[#0d2f4f] transition-colors flex items-center gap-1">
                      Postuler <ChevronRight className="w-3 h-3" />
                    </button>
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
                      <Save className="w-3 h-3" /> Sauvegarder
                    </button>
                    <button className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Pas intéressé
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
