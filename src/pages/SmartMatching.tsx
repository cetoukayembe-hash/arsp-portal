import { useState, useEffect } from 'react';
import { Zap, MapPin, Briefcase, Star, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function SmartMatching() {
  const auth = useAuth();
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: ent } = await supabase.from('enterprises').select('*');
    const { data: ten } = await supabase.from('tenders').select('*');
    if (ent) setEnterprises(ent);
    if (ten) setTenders(ten);
    setLoading(false);
  }

  function calculateMatchScore(item: any, profile: any): number {
    let score = 0;
    if (!item || !profile) return 0;
    if (item.sector === profile.sector) score += 40;
    if (item.province === profile.province) score += 30;
    if (item.city === profile.city) score += 15;
    if (item.congolese_capital >= 51) score += 15;
    return Math.min(score, 100);
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    return 'Faible';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-violet-500 text-white flex items-center justify-center">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">Matching Intelligent</h2>
          <p className="text-sm text-gray-500">
            {auth.userRole === 'subcontractor'
              ? "Appels d'offres correspondant a votre profil"
              : 'Entreprises correspondant a vos besoins'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Analyse en cours...</div>
      ) : auth.userRole === 'subcontractor' ? (

        <div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Zap className="w-5 h-5 text-violet-600 shrink-0" />
            <p className="text-sm text-violet-700">
              Notre algorithme analyse votre profil et identifie les appels d'offres les plus compatibles avec votre secteur et votre province.
            </p>
          </div>

          {tenders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl card-shadow">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun appel d'offres disponible pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tenders.map((tender) => {
                const score = calculateMatchScore(tender, { sector: 'Construction', province: 'Kinshasa' });
                return (
                  <div
                    key={tender.id}
                    onClick={() => setSelectedItem(tender)}
                    className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#0a2540]">{tender.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(score)}`}>
                            {score}% {getScoreLabel(score)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{tender.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {tender.sector && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              <Briefcase className="w-3 h-3" />{tender.sector}
                            </span>
                          )}
                          {tender.province && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />{tender.province}
                            </span>
                          )}
                          {tender.budget && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {tender.budget}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-14 h-14 rounded-full border-4 border-violet-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600">{score}%</span>
                        </div>
                        <span className="text-xs text-gray-400">Match</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: score + '%' }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="flex items-center gap-1 text-sm text-[#007FFF] hover:underline">
                        Postuler <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        <div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Zap className="w-5 h-5 text-violet-600 shrink-0" />
            <p className="text-sm text-violet-700">
              Notre algorithme identifie les entreprises de sous-traitance les plus compatibles avec vos besoins selon le secteur, la province et la capacite financiere.
            </p>
          </div>

          {enterprises.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl card-shadow">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune entreprise enregistree pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enterprises.map((enterprise) => {
                const score = calculateMatchScore(enterprise, { sector: 'Construction', province: 'Kinshasa', city: 'Gombe' });
                return (
                  <div
                    key={enterprise.id}
                    onClick={() => setSelectedItem(enterprise)}
                    className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#0a2540]">{enterprise.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(score)}`}>
                            {score}% {getScoreLabel(score)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {enterprise.sector && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              <Briefcase className="w-3 h-3" />{enterprise.sector}
                            </span>
                          )}
                          {enterprise.province && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />{enterprise.province}
                            </span>
                          )}
                          {enterprise.congolese_capital && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              Capital congolais: {enterprise.congolese_capital}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-14 h-14 rounded-full border-4 border-violet-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-600">{score}%</span>
                        </div>
                        <span className="text-xs text-gray-400">Match</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: score + '%' }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="flex items-center gap-1 text-sm text-[#007FFF] hover:underline">
                        Voir le profil <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}