import { useState, useEffect } from 'react';
import { Zap, MapPin, Briefcase, Star, ChevronRight, X, Building2, DollarSign, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

interface UserProfile {
  id: string;
  sector?: string;
  province?: string;
  city?: string;
  congolese_capital?: number;
}

interface MatchBreakdown {
  sector: boolean;
  province: boolean;
  city: boolean;
  capital: boolean;
}

export function SmartMatching() {
  const auth = useAuth();
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<MatchBreakdown | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // User profile comes from auth context (already loaded in App.tsx)
      const profile: UserProfile = {
        id: auth.userId,
        sector: auth.userSector,
        province: auth.userProvince,
        city: auth.userCity,
      };
      setUserProfile(profile);

      // Fetch enterprises and tenders
      const { data: ent, error: entError } = await supabase.from('enterprises').select('*');
      const { data: ten, error: tenError } = await supabase.from('tenders').select('*');

      if (entError) console.error('Error fetching enterprises:', entError);
      if (tenError) console.error('Error fetching tenders:', tenError);

      if (ent) setEnterprises(ent);
      if (ten) setTenders(ten);
    } catch (err) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  }

  function calculateMatchScore(
    item: any,
    profile: UserProfile | null,
    role: 'subcontractor' | 'prime'
  ): { score: number; breakdown: MatchBreakdown } {
    if (!item || !profile) {
      return { score: 0, breakdown: { sector: false, province: false, city: false, capital: false } };
    }

    let score = 0;
    const breakdown: MatchBreakdown = { sector: false, province: false, city: false, capital: false };

    // Sector match (highest weight)
    if (item.sector && profile.sector && item.sector.toLowerCase() === profile.sector.toLowerCase()) {
      score += 40;
      breakdown.sector = true;
    }

    // Province match
    if (item.province && profile.province && item.province.toLowerCase() === profile.province.toLowerCase()) {
      score += 30;
      breakdown.province = true;
    }

    // City match (only for enterprises matching to tenders, or if both have city)
    if (item.city && profile.city && item.city.toLowerCase() === profile.city.toLowerCase()) {
      score += 15;
      breakdown.city = true;
    }

    // Congolese capital — only relevant when PRIME is looking at ENTERPRISES
    // (subcontractors don't have congolese_capital in their profile for tender matching)
    if (role === 'prime' && item.congolese_capital && item.congolese_capital >= 51) {
      score += 15;
      breakdown.capital = true;
    }

    return { score: Math.min(score, 100), breakdown };
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    return 'Faible';
  };

  const handleItemClick = (item: any, role: 'subcontractor' | 'prime') => {
    const { score, breakdown } = calculateMatchScore(item, userProfile, role);
    setSelectedItem(item);
    setSelectedBreakdown(breakdown);
  };

  const handleApply = (tenderId: string) => {
    // Navigate to tender detail or open application modal
    window.location.href = `/tenders?id=${tenderId}&action=postuler`;
  };

  const handleViewProfile = (enterpriseId: string) => {
    // Navigate to enterprise profile
    window.location.href = `/enterprise-search?id=${enterpriseId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-500">Analyse en cours...</span>
      </div>
    );
  }

  // No profile warning
  if (!loading && !userProfile?.sector) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <Briefcase className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-amber-800 mb-2">Profil incomplet</h3>
        <p className="text-amber-700 text-sm mb-4">
          Veuillez compléter votre profil (secteur, province, ville) pour bénéficier du matching intelligent.
        </p>
        <a
          href="/profil"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          Compléter mon profil
        </a>
      </div>
    );
  }

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
              ? "Appels d'offres correspondant à votre profil"
              : 'Entreprises correspondant à vos besoins'}
          </p>
        </div>
      </div>

      {/* Profile summary */}
      <div className="bg-white border rounded-xl p-4 mb-6 flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
          <Briefcase className="w-3 h-3 inline mr-1" />
          {userProfile?.sector || 'Non défini'}
        </span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
          <MapPin className="w-3 h-3 inline mr-1" />
          {userProfile?.province || 'Non défini'}
        </span>
        {userProfile?.city && (
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
            <MapPin className="w-3 h-3 inline mr-1" />
            {userProfile.city}
          </span>
        )}
      </div>

      {auth.userRole === 'subcontractor' ? (
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
                const { score, breakdown } = calculateMatchScore(tender, userProfile, 'subcontractor');
                return (
                  <div
                    key={tender.id}
                    onClick={() => handleItemClick(tender, 'subcontractor')}
                    className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#0a2540]">{tender.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(score)}`}>
                            {score}% {getScoreLabel(score)}
                          </span>
                        </div>
                        {tender.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tender.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {tender.sector && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${breakdown.sector ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <Briefcase className="w-3 h-3" />{tender.sector}
                            </span>
                          )}
                          {tender.province && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${breakdown.province ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
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
                          className={`h-2 rounded-full ${getScoreBarColor(score)}`}
                          style={{ width: score + '%' }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(tender.id);
                        }}
                        className="flex items-center gap-1 text-sm text-[#007FFF] hover:underline font-medium"
                      >
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
              Notre algorithme identifie les entreprises de sous-traitance les plus compatibles avec vos besoins selon le secteur, la province et la capacité financière.
            </p>
          </div>

          {enterprises.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl card-shadow">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune entreprise enregistrée pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enterprises.map((enterprise) => {
                const { score, breakdown } = calculateMatchScore(enterprise, userProfile, 'prime');
                return (
                  <div
                    key={enterprise.id}
                    onClick={() => handleItemClick(enterprise, 'prime')}
                    className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#0a2540]">{enterprise.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(score)}`}>
                            {score}% {getScoreLabel(score)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {enterprise.sector && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${breakdown.sector ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <Briefcase className="w-3 h-3" />{enterprise.sector}
                            </span>
                          )}
                          {enterprise.province && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${breakdown.province ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <MapPin className="w-3 h-3" />{enterprise.province}
                            </span>
                          )}
                          {enterprise.city && (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${breakdown.city ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              <MapPin className="w-3 h-3" />{enterprise.city}
                            </span>
                          )}
                          {enterprise.congolese_capital && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${breakdown.capital ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
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
                          className={`h-2 rounded-full ${getScoreBarColor(score)}`}
                          style={{ width: score + '%' }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(enterprise.id);
                        }}
                        className="flex items-center gap-1 text-sm text-[#007FFF] hover:underline font-medium"
                      >
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

      {/* Detail Modal */}
      {selectedItem && selectedBreakdown && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0a2540]">
                {selectedItem.title || selectedItem.name}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Score breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Détail du score</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      Secteur d'activité
                    </span>
                    <span className={selectedBreakdown.sector ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                      {selectedBreakdown.sector ? '✓ Correspond (+40%)' : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Province
                    </span>
                    <span className={selectedBreakdown.province ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                      {selectedBreakdown.province ? '✓ Correspond (+30%)' : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Ville
                    </span>
                    <span className={selectedBreakdown.city ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                      {selectedBreakdown.city ? '✓ Correspond (+15%)' : '—'}
                    </span>
                  </div>
                  {auth.userRole === 'prime' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        Capital congolais ≥ 51%
                      </span>
                      <span className={selectedBreakdown.capital ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                        {selectedBreakdown.capital ? '✓ Correspond (+15%)' : '—'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Item details */}
              {selectedItem.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{selectedItem.description}</p>
                </div>
              )}
              {selectedItem.budget && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  Budget: {selectedItem.budget}
                </div>
              )}
              {selectedItem.deadline && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Date limite: {new Date(selectedItem.deadline).toLocaleDateString('fr-FR')}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 flex gap-3">
                {auth.userRole === 'subcontractor' ? (
                  <button
                    onClick={() => handleApply(selectedItem.id)}
                    className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Postuler maintenant
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewProfile(selectedItem.id)}
                    className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Voir le profil complet
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}