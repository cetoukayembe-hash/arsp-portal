import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ClipboardList, Scale, TrendingUp, Building2, FileCheck, MapPin,
  ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Circle, Clock,
  Phone, Mail, MapPinned, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/App';

const missions = [
  { icon: ClipboardList, title: 'Recenser et agréer', desc: 'Recenser et agréer les entreprises éligibles à la sous-traitance selon leurs domaines d\'activités.' },
  { icon: Scale, title: 'Faire appliquer', desc: 'Faire appliquer les règles régissant l\'activité de sous-traitance.' },
  { icon: TrendingUp, title: 'Promouvoir', desc: 'Promouvoir les petites et moyennes entreprises à capitaux majoritairement Congolais.' },
  { icon: Building2, title: 'De l\'informel au formel', desc: 'Ramener les entreprises congolaises du secteur informel vers le secteur formel.' },
  { icon: FileCheck, title: 'Respect des engagements', desc: 'Veiller au respect des conditions requises dans la conclusion des contrats de sous-traitance.' },
  { icon: MapPin, title: 'Contenu local', desc: 'Concevoir et assurer la mise en oeuvre de la politique nationale du contenu local.' },
];

const eligibility = [
  { title: 'Personne Physique', items: ['Être de nationalité congolaise', 'Avoir son siège social en RDC', 'Majorité du personnel de nationalité congolaise', 'Avoir un RCCM', 'Avoir une Identification Nationale', 'Avoir un Numéro d\'Impôt', 'Produire une Attestation Fiscale', 'Attestation CNSS si applicable'] },
  { title: 'Personne Morale (Entreprise)', items: ['Siège social en RDC', 'Au moins 51% du capital social détenu par des congolais', 'Organes de gestion majoritairement congolais', 'Personnel essentiellement congolais', 'RCCM valide', 'Identification Nationale', 'Numéro d\'Impôt', 'Attestation Fiscale', 'Attestation CNSS'] },
  { title: 'Entreprenant', items: ['Déclaration conforme à l\'Article 62 de l\'OHADA', 'Preuve de paiement de la patente'] },
  { title: 'Formation Médicale non commerçante', items: ['Personnalité juridique ou autorisation du Ministère de la Santé', 'Siège en RDC', 'Majorité des membres de nationalité congolaise', 'Attestation CNSS'] },
  { title: 'Autre Entité', items: ['Exercer dans une profession réglementée', 'Siège ou adresse professionnelle en RDC', 'Majorité des membres et dirigeants de nationalité congolaise', 'Attestation Fiscale', 'Attestation CNSS'] },
];

const roadmap = [
  { phase: 'MVP', status: 'active', features: ['Inscription unifiée avec upload de documents', 'Carte d\'identité numérique', 'Recherche d\'entreprises'] },
  { phase: 'V2', status: 'upcoming', features: ['Flux d\'appels d\'offres avec alertes', 'Soumission directe', 'Tableau de bord de conformité'] },
  { phase: 'V3', status: 'upcoming', features: ['Algorithme de matching intelligent', 'Messagerie intégrée', 'Analytics ARSP', 'Gestion des contrats'] },
  { phase: 'V4', status: 'upcoming', features: ['Intégration paiement', 'E-signature des contrats', 'Workflow de résolution des litiges'] },
];

export function LandingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [openEligibility, setOpenEligibility] = useState<number | null>(null);
  const [openRoadmap, setOpenRoadmap] = useState<number | null>(0);
  const [showLogin, setShowLogin] = useState(false);
  const [role, setRole] = useState<'subcontractor' | 'prime' | 'admin'>('subcontractor');

  return (
    <div className="min-h-screen bg-[#0a2540]">

      {/* Hero */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <img src="/hero-background.jpeg" alt="Kinshasa" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2540]/80 via-[#0a2540]/60 to-[#0a2540]/90" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            « Une classe moyenne congolaise, c'est possible »
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Enregistrez votre entreprise de sous-traitance, accédez aux marchés, et développez votre activité avec l'ARSP
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {auth.isAuthenticated ? (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-white text-[#0a2540] rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Mon Portail
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => auth.logout()}
                  className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="px-8 py-3 bg-white text-[#0a2540] rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                S'enregistrer
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate('/enterprise-search')}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Consulter le registre
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 glass-strip py-4 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-around gap-4 text-center">
            <div><div className="text-2xl font-bold text-[#0a2540]">5,000+</div><div className="text-sm text-gray-600">Entreprises enregistrées</div></div>
            <div><div className="text-2xl font-bold text-[#0a2540]">12,000+</div><div className="text-sm text-gray-600">Contrats suivis</div></div>
            <div><div className="text-2xl font-bold text-[#0a2540]">98%</div><div className="text-sm text-gray-600">Taux de conformité</div></div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Notre Mission</h2>
          <p className="text-blue-200">La vision stratégique de l'Autorité de Régulation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-[#0d2f4f] rounded-xl p-6 card-shadow hover:card-shadow-hover hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-[#007FFF] text-white flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{m.title}</h3>
                <p className="text-sm text-blue-200 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-2">Critères d'éligibilité</h2>
            <p className="text-gray-600">Vérifiez que votre entreprise remplit les conditions requises</p>
          </div>
          <div className="space-y-3">
            {eligibility.map((e, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenEligibility(openEligibility === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-[#0a2540]">{e.title}</span>
                  {openEligibility === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {openEligibility === i && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <ul className="space-y-2">
                      {e.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Feuille de route</h2>
          <p className="text-blue-200">Les 4 phases de développement du portail ARSP</p>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-900" />
          <div className="space-y-6">
            {roadmap.map((r, i) => (
              <div key={i} className="relative pl-16">
                <div className={`absolute left-3 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 bg-[#0a2540] ${r.status === 'active' ? 'border-[#007FFF] text-[#007FFF]' : 'border-blue-800 text-blue-600'}`}>
                  {r.status === 'active' ? <Circle className="w-3 h-3 fill-current step-pulse" /> : <Clock className="w-3 h-3" />}
                </div>
                <div
                  className={`border rounded-xl p-5 cursor-pointer transition-all ${openRoadmap === i ? 'border-[#007FFF] bg-[#0d2f4f] shadow-md' : 'border-blue-900 bg-[#0d2f4f] hover:shadow-sm'}`}
                  onClick={() => setOpenRoadmap(openRoadmap === i ? null : i)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'active' ? 'bg-[#007FFF] text-white' : 'bg-blue-900 text-blue-300'}`}>{r.phase}</span>
                      <span className="font-semibold text-white">{r.status === 'active' ? 'En cours' : 'À venir'}</span>
                    </div>
                    {openRoadmap === i ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-400" />}
                  </div>
                  {openRoadmap === i && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      {r.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-blue-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Director Message */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <img src="/Miguel.jpeg" alt="Directeur ARSP" className="w-48 h-48 rounded-2xl object-cover shadow-lg shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-[#0a2540] mb-4">Message du Directeur Général</h2>
            <p className="text-gray-600 leading-relaxed italic">
              "Notre mission est de structurer et de professionnaliser le secteur de la sous-traitance en République Démocratique du Congo, en offrant aux entreprises congolaises les outils nécessaires pour accéder aux marchés et contribuer au développement économique de notre pays."
            </p>
            <p className="text-[#0a2540] font-semibold mt-4">— Miguel Kashal Katemb, Directeur Général de l'ARSP</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#0a2540] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre le registre ARSP ?</h2>
          <p className="text-white/80 mb-8">L'enregistrement est gratuit et ouvert à toutes les entreprises congolaises éligibles à la sous-traitance.</p>
          <button
            onClick={() => { if (auth.isAuthenticated) { navigate('/dashboard'); } else { setShowLogin(true); } }}
            className="px-8 py-3 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-all shadow-lg"
          >
            Commencer l'enregistrement
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <div className="font-bold text-[#0a2540]">ARSP</div>
                <div className="text-xs text-gray-500">Autorité de Régulation de la Sous-traitance</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Établissement public régi par la loi n°17/001 du 08 février 2017 fixant les règles applicables à la sous-traitance dans le secteur privé.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#0a2540] mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><MapPinned className="w-4 h-4 text-[#007FFF]" /> 87, Avenue de l'Equateur, Gombe, Kinshasa</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#007FFF]" /> +243 824940440</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#007FFF]" /> contact@arsp.cd</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#0a2540] mb-4">Suivez-nous</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-[#F6F9FC] flex items-center justify-center text-[#0a2540] hover:bg-[#0a2540] hover:text-white transition-all"><ExternalLink className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-lg bg-[#F6F9FC] flex items-center justify-center text-[#0a2540] hover:bg-[#0a2540] hover:text-white transition-all"><Mail className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-lg bg-[#F6F9FC] flex items-center justify-center text-[#0a2540] hover:bg-[#0a2540] hover:text-white transition-all"><Phone className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          © 2026 ARSP – Autorité de Régulation de la Sous-traitance dans le secteur Privé. Tous droits réservés.
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
              <h3 className="text-xl font-bold text-[#0a2540]">Connexion au Portail ARSP</h3>
              <p className="text-sm text-gray-500">Sélectionnez votre profil pour continuer</p>
            </div>
            <div className="space-y-3 mb-6">
              {([
                { id: 'subcontractor', label: 'Entreprise de Sous-traitance' },
                { id: 'prime', label: 'Entreprise Donneuse d\'Ordres' },
                { id: 'admin', label: 'Administrateur ARSP' },
              ] as const).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${role === r.id ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-[#0a2540]">{r.label}</div>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" defaultValue="demo@arsp.cd" />
              <input type="password" placeholder="Mot de passe" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" defaultValue="password" />
              <button
                onClick={() => { auth.login(role); setShowLogin(false); navigate('/dashboard'); }}
                className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] transition-colors"
              >
                Se connecter
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              Pas encore de compte ? <span className="text-[#007FFF] cursor-pointer">Créer un compte</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}