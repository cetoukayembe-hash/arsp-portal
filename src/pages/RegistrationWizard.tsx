import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Upload, FileText, Shield, Users, Building, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const steps = [
  { label: 'Compte', icon: Shield },
  { label: 'Entreprise', icon: Building },
  { label: 'Personnel', icon: Users },
  { label: 'Documents', icon: FileText },
  { label: 'Revision', icon: Check },
];

const sectors = ['Construction', 'Mining', 'Logistics', 'IT', 'Agriculture', 'Energy', 'Services', 'Healthcare'];
const provinces = ['Kinshasa', 'Haut-Katanga', 'Lualaba', 'Kongo Central', 'Nord-Kivu', 'Sud-Kivu', 'Ituri', 'Maniema'];

export function RegistrationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    type: 'Personne Morale',
    name: '', rccm: '', idNational: '', taxNumber: '',
    sector: '', province: '', city: '', foundedYear: '', employees: '',
    congoleseCapital: 51,
    personnelCongolais: true,
    experience: [] as string[],
    documents: { rccm: false, fiscal: false, cnss: false, identity: false },
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const validateStep = () => {
    if (step === 0) return form.email && form.password && form.password === form.confirmPassword;
    if (step === 1) return form.name && form.rccm && form.idNational && form.taxNumber && form.sector && form.province;
    if (step === 2) return form.congoleseCapital >= 51;
    if (step === 3) return Object.values(form.documents).every(Boolean);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('enterprises').insert([{
      name: form.name,
      email: form.email,
      rccm: form.rccm,
      id_national: form.idNational,
      tax_number: form.taxNumber,
      type: form.type,
      sector: form.sector,
      province: form.province,
      city: form.city,
      employees: parseInt(form.employees),
      congolese_capital: form.congoleseCapital,
      founded_year: form.foundedYear,
      experience: form.experience,
      status: 'pending',
    }]);
    setLoading(false);
    if (error) {
      console.error('Error saving:', error);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto pt-8">
        <div className="bg-white rounded-xl p-8 text-center card-shadow animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a2540] mb-2">Inscription soumise avec succes</h2>
          <p className="text-gray-600 mb-2">Votre demande est en cours de traitement par l'equipe ARSP.</p>
          <div className="bg-[#F6F9FC] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Numero de reference</p>
            <p className="text-xl font-bold text-[#0a2540]">ARSP-{Date.now().toString().slice(-6)}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/digital-id')} className="px-6 py-2 bg-[#0a2540] text-white rounded-lg font-medium hover:bg-[#0d2f4f] transition-colors">
              Voir ma carte numerique
            </button>
            <button onClick={() => navigate('/compliance')} className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative h-48 rounded-xl overflow-hidden mb-6">
        <img src="/construction-sector.jpeg" alt="Construction" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a2540]/60 flex items-center px-8">
          <h2 className="text-3xl font-bold text-white">Enregistrement de l'entreprise</h2>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                isDone ? 'bg-[#0a2540] text-white' : isActive ? 'bg-[#007FFF] text-white step-pulse' : 'bg-gray-200 text-gray-400'
              }`}>
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive || isDone ? 'text-[#0a2540]' : 'text-gray-400'}`}>{s.label}</span>
              {i < steps.length - 1 && (
                <div className={`absolute top-5 left-[60%] right-[-40%] h-0.5 ${i < step ? 'bg-[#0a2540]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl p-6 card-shadow">

        {/* Step 0 - Account */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4">1. Compte et type d'entreprise</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@entreprise.cd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.password} onChange={(e) => update('password', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'entreprise</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Personne Physique', 'Personne Morale', 'Entreprenant', 'Formation Medicale', 'Autre'].map((t) => (
                  <button key={t} onClick={() => update('type', t)} className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${form.type === t ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1 - Enterprise Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4">2. Details de l'entreprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Batiments du Congo SARL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RCCM</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.rccm} onChange={(e) => update('rccm', e.target.value)} placeholder="RCCM/KIN/20XX-B-XXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Nationale</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.idNational} onChange={(e) => update('idNational', e.target.value)} placeholder="IDNAT-XXX-XXX-XXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero d'Impot (NIF)</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.taxNumber} onChange={(e) => update('taxNumber', e.target.value)} placeholder="NIF-AXXXXXXXXXB" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur principal</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.sector} onChange={(e) => update('sector', e.target.value)}>
                  <option value="">Selectionner</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.province} onChange={(e) => update('province', e.target.value)}>
                  <option value="">Selectionner</option>
                  {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex: Kinshasa" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annee de creation</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.foundedYear} onChange={(e) => update('foundedYear', e.target.value)} placeholder="2018" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'employes</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={form.employees} onChange={(e) => update('employees', e.target.value)} placeholder="25" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs d'experience passee (selectionnez tous)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sectors.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const exp = form.experience.includes(s)
                        ? form.experience.filter(e => e !== s)
                        : [...form.experience, s];
                      update('experience', exp);
                    }}
                    className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.experience.includes(s)
                        ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Ownership */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4">3. Structure de propriete</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capital congolais (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min="0" max="100" value={form.congoleseCapital} onChange={(e) => update('congoleseCapital', parseInt(e.target.value))} className="flex-1 accent-[#007FFF]" />
                <span className="text-lg font-bold text-[#0a2540] w-16 text-right">{form.congoleseCapital}%</span>
              </div>
              {form.congoleseCapital < 51 && (
                <p className="text-xs text-red-500 mt-1">Le capital congolais doit etre d'au moins 51% pour l'agrement ARSP.</p>
              )}
              {form.congoleseCapital >= 51 && (
                <p className="text-xs text-emerald-600 mt-1">Critere de capital congolais satisfait.</p>
              )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" id="personnelCongolais" checked={form.personnelCongolais} onChange={(e) => update('personnelCongolais', e.target.checked)} className="w-4 h-4 accent-[#007FFF]" />
              <label htmlFor="personnelCongolais" className="text-sm text-gray-700">Majorite du personnel est de nationalite congolaise</label>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-[#0a2540] mb-3">Personnel cle</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-medium">
                  <span>Nom</span><span>Fonction</span><span>Nationalite</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input className="px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Jean Kabongo" defaultValue="Jean Kabongo" />
                  <input className="px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="DG" defaultValue="Directeur General" />
                  <input className="px-2 py-1.5 border border-gray-200 rounded text-sm" placeholder="Congolaise" defaultValue="Congolaise" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Documents */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4">4. Documents requis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'rccm', label: 'RCCM (Registre de Commerce)', icon: FileText },
                { key: 'fiscal', label: 'Attestation Fiscale', icon: FileText },
                { key: 'cnss', label: 'Attestation CNSS', icon: FileText },
                { key: 'identity', label: "Piece d'identite du representant", icon: FileText },
              ].map((doc) => {
                const uploaded = (form.documents as any)[doc.key];
                return (
                  <div
                    key={doc.key}
                    onClick={() => update('documents', { ...form.documents, [doc.key]: !uploaded })}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:shadow-sm ${uploaded ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-[#007FFF]'}`}
                  >
                    {uploaded ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium text-[#0a2540]">{doc.label}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    {uploaded && <p className="text-xs text-emerald-600 mt-1">Uploade avec succes</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 - Review */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4">5. Revision et soumission</h3>
            <div className="space-y-3">
              <div className="bg-[#F6F9FC] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Informations generales</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Type</div><div className="text-[#0a2540] font-medium">{form.type}</div>
                  <div className="text-gray-500">Nom</div><div className="text-[#0a2540] font-medium">{form.name || 'Non renseigne'}</div>
                  <div className="text-gray-500">RCCM</div><div className="text-[#0a2540] font-medium">{form.rccm || 'Non renseigne'}</div>
                  <div className="text-gray-500">Secteur</div><div className="text-[#0a2540] font-medium">{form.sector || 'Non renseigne'}</div>
                  <div className="text-gray-500">Province</div><div className="text-[#0a2540] font-medium">{form.province || 'Non renseigne'}</div>
                  <div className="text-gray-500">Capital congolais</div><div className="text-[#0a2540] font-medium">{form.congoleseCapital}%</div>
                  <div className="text-gray-500">Experience</div><div className="text-[#0a2540] font-medium">{form.experience.join(', ') || 'Non renseigne'}</div>
                </div>
              </div>
              <div className="bg-[#F6F9FC] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Documents soumis</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(form.documents).map(([key, val]) => (
                    <span key={key} className={`px-3 py-1 rounded-full text-xs font-medium ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {key === 'rccm' && 'RCCM'}
                      {key === 'fiscal' && 'Fiscal'}
                      {key === 'cnss' && 'CNSS'}
                      {key === 'identity' && 'Identite'}
                      {val ? ' ✓' : ' ✗'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" id="attestation" className="w-4 h-4 mt-0.5 accent-[#007FFF]" />
              <label htmlFor="attestation" className="text-sm text-gray-700">
                Je certifie que les informations fournies sont exactes et conformes a la loi n 17/001 du 08 fevrier 2017.
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Precedent
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!validateStep()}
              className="flex items-center gap-2 px-6 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#007FFF] text-white rounded-lg text-sm font-medium hover:bg-[#0066CC] transition-colors disabled:opacity-40"
            >
              {loading ? 'Envoi en cours...' : "Soumettre l'inscription"}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}