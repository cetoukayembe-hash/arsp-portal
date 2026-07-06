import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
 ClipboardList, Scale, TrendingUp, Building2, FileCheck, MapPin,
 ChevronDown, ChevronUp, ArrowRight, CheckCircle2,
 Phone, Mail, MapPinned, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';

const missions = [
 { icon: ClipboardList, title: 'Recenser et agréer', desc: 'Recenser et agréer les entreprises éligibles à la sous-traitance selon leurs domaines d\'activités.' },
 { icon: Scale, title: 'Faire appliquer', desc: 'Faire appliquer les règles régissant l\'activité de sous-traitance.' },
 { icon: TrendingUp, title: 'Promouvoir', desc: 'Promouvoir les petites et moyennes entreprises à capitaux majoritairement congolais.' },
 { icon: Building2, title: 'De l\'informel au formel', desc: 'Ramener les entreprises congolaises du secteur informel vers le secteur formel.' },
 { icon: FileCheck, title: 'Respect des engagements', desc: 'Veiller au respect des conditions requises dans la conclusion des contrats de sous-traitance.' },
 { icon: MapPin, title: 'Contenu local', desc: 'Concevoir et assurer la mise en œuvre de la politique nationale du contenu local.' },
];

const eligibility = [
 { title: 'Personne Physique', items: ['Être de nationalité congolaise', 'Avoir son siège social en RDC', 'Majorité du personnel de nationalité congolaise', 'Avoir un RCCM', 'Avoir une Identification Nationale', 'Avoir un Numéro d\'Impôt', 'Produire une Attestation Fiscale', 'Attestation CNSS si applicable'] },
 { title: 'Personne Morale (Entreprise)', items: ['Siège social en RDC', 'Au moins 51% du capital social détenu par des Congolais', 'Organes de gestion majoritairement congolais', 'Personnel essentiellement congolais', 'RCCM valide', 'Identification Nationale', 'Numéro d\'Impôt', 'Attestation Fiscale', 'Attestation CNSS'] },
 { title: 'Entreprenant', items: ['Déclaration conforme à l\'Article 62 de l\'OHADA', 'Preuve de paiement de la patente'] },
 { title: 'Formation Médicale non commerçante', items: ['Personnalité juridique ou autorisation du Ministère de la Santé', 'Siège en RDC', 'Majorité des membres de nationalité congolaise', 'Attestation CNSS'] },
 { title: 'Autre Entité', items: ['Exercer dans une profession réglementée', 'Siège ou adresse professionnelle en RDC', 'Majorité des membres et dirigeants de nationalité congolaise', 'Attestation Fiscale', 'Attestation CNSS'] },
];

export function LandingPage() {
 const navigate = useNavigate();
 const auth = useAuth();
 const [openEligibility, setOpenEligibility] = useState<number | null>(null);
 const [showLogin, setShowLogin] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [authError, setAuthError] = useState('');
 const [authLoading, setAuthLoading] = useState(false);

 async function handleLogin() {
 setAuthLoading(true);
 setAuthError('');
 const { error } = await supabase.auth.signInWithPassword({ email, password });
 if (error) {
 setAuthError(error.message);
 } else {
 setShowLogin(false);
 navigate('/dashboard');
 }
 setAuthLoading(false);
 }

 return (
 <div className="min-h-screen bg-[#0a2540]">

 {/* Hero */}
 <section className="relative min-h-[500px] sm:min-h-[600px] flex flex-col justify-center overflow-hidden pb-32 sm:pb-0">
 <img src="/photo-fatshi-2.jpeg" alt="Kinshasa" className="absolute inset-0 w-full h-full object-cover object-top" />
 <div className="absolute inset-0 bg-gradient-to-b from-[#0a2540]/80 via-[#0a2540]/60 to-[#0a2540]/90" />

 {/* Logo top left */}
 <div className="absolute top-4 left-4 sm:left-6 z-20 flex items-center gap-2 sm:gap-3">
 <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30" />
 <div>
 <div className="text-white font-bold text-sm">ARSP</div>
 <div className="text-blue-200 text-[10px]">Portail Numérique</div>
 </div>
 </div>

 <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto pt-16 sm:pt-0">
 <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
 Une classe moyenne congolaise, c&apos;est possible
 </h1>
 <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
 Enregistrez votre entreprise de sous-traitance, accédez aux marchés, et développez votre activité avec l&apos;ARSP
 </p>
 <div className="flex flex-col gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
 {auth.isAuthenticated ? (
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button
 onClick={() => navigate('/dashboard')}
 className="px-6 sm:px-8 py-3 bg-white text-[#0a2540] rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
 >
 Mon Portail
 <ArrowRight className="w-4 h-4" />
 </button>
 <button
 onClick={() => auth.logout()}
 className="px-6 sm:px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
 >
 Déconnexion
 </button>
 </div>
 ) : (
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <button
 onClick={() => navigate('/register')}
 className="px-6 sm:px-8 py-3 bg-white text-[#0a2540] rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
 >
 S&apos;enregistrer
 <ArrowRight className="w-4 h-4" />
 </button>
 <button
 onClick={() => setShowLogin(true)}
 className="px-6 sm:px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
 >
 Se connecter
 </button>
 </div>
 )}
 <button
 onClick={() => navigate('/enterprise-search')}
 className="px-6 sm:px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all w-full sm:w-auto mx-auto"
 >
 Consulter le registre
 </button>
 </div>
 </div>
 </section>

 {/* Stats — separate section, not absolute */}
 <section className="bg-white py-6 sm:py-4 px-4">
 <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 sm:gap-4 text-center">
 <div>
 <div className="text-xl sm:text-2xl font-bold text-[#0a2540]">5 000+</div>
 <div className="text-xs sm:text-sm text-gray-600">Entreprises</div>
 </div>
 <div>
 <div className="text-xl sm:text-2xl font-bold text-[#0a2540]">12 000+</div>
 <div className="text-xs sm:text-sm text-gray-600">Contrats</div>
 </div>
 <div>
 <div className="text-xl sm:text-2xl font-bold text-[#0a2540]">98%</div>
 <div className="text-xs sm:text-sm text-gray-600">Conformité</div>
 </div>
 </div>
 </section>

 {/* Mission */}
 <section className="py-20 px-4 max-w-6xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-3xl font-bold text-white mb-2">Notre Mission</h2>
 <p className="text-blue-200">La vision stratégique de l&apos;Autorité de Régulation</p>
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
 <h2 className="text-3xl font-bold text-[#0a2540] mb-2">Critères d&apos;éligibilité</h2>
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

 {/* Director Message */}
 <section className="py-16 px-4 bg-[#0a2540]">
 <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
 <img
 src="/Ted-web.jpeg"
 alt="Directeur ARSP"
 className="w-64 sm:w-72 h-auto max-h-[28rem] sm:max-h-[24rem] rounded-2xl object-contain shadow-lg shrink-0"
/>
 <div>
 <h2 className="text-2xl font-bold text-white mb-4">Message du Directeur Général</h2>
 <p className="text-blue-200 leading-relaxed italic">
 Notre mission est de structurer et de professionnaliser le secteur de la sous-traitance en République Démocratique du Congo, en offrant aux entreprises congolaises les outils nécessaires pour accéder aux marchés et contribuer au développement économique de notre pays.
 </p>
 <p className="text-white font-semibold mt-4">Beleshayi Kasanda Juan Ted, Directeur Général de l&apos;ARSP</p>
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-16 px-4 bg-[#0d2f4f] text-white text-center">
 <div className="max-w-2xl mx-auto">
 <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre le registre ARSP ?</h2>
 <p className="text-white/80 mb-8">L&apos;enregistrement est gratuit et ouvert à toutes les entreprises congolaises éligibles à la sous-traitance.</p>
 <button
 onClick={() => { if (auth.isAuthenticated) { navigate('/dashboard'); } else { navigate('/register'); } }}
 className="px-8 py-3 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-all shadow-lg"
 >
 Commencer l&apos;enregistrement
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
 <p className="text-sm text-gray-600">Établissement public régi par la loi n° 17/001 du 08 février 2017 fixant les règles applicables à la sous-traitance dans le secteur privé.</p>
 </div>
 <div>
 <h4 className="font-semibold text-[#0a2540] mb-4">Contact</h4>
 <div className="space-y-2 text-sm text-gray-600">
 <div className="flex items-center gap-2"><MapPinned className="w-4 h-4 text-[#007FFF]" /> 87, Avenue de l&apos;Équateur, Gombe, Kinshasa</div>
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
 © 2026 ARSP — Autorité de Régulation de la Sous-traitance dans le Secteur Privé. Tous droits réservés.
 </div>
 </footer>

 {/* Login Modal */}
 {showLogin && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
 <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
 <div className="text-center mb-6">
 <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
 <h3 className="text-xl font-bold text-[#0a2540]">Connexion au Portail ARSP</h3>
 <p className="text-sm text-gray-500">Entrez vos identifiants</p>
 </div>
 <div className="space-y-3">
 <input
 type="email"
 placeholder="Email"
 className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 <input
 type="password"
 placeholder="Mot de passe"
 className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 {authError && (
 <p className="text-xs text-red-500 text-center">{authError}</p>
 )}
 <button
 onClick={handleLogin}
 disabled={authLoading}
 className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] transition-colors disabled:opacity-50"
 >
 {authLoading ? 'Chargement...' : 'Se connecter'}
 </button>
 </div>
 <p className="text-center text-xs text-gray-400 mt-4">
 Pas encore de compte ?{' '}
 <span
 className="text-[#007FFF] cursor-pointer hover:underline"
 onClick={() => { setShowLogin(false); navigate('/register'); }}
 >
 Créer un compte
 </span>
 </p>
 <p className="text-center text-xs text-gray-400 mt-2">
 Compte administrateur ? Contactez l&apos;équipe ARSP.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}