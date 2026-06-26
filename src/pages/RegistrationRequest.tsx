import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, AlertTriangle, ArrowRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const docFields = [
  { key: 'doc_rccm', label: 'RCCM (Registre de Commerce)', required: true },
  { key: 'doc_fiscal', label: 'Attestation Fiscale', required: true },
  { key: 'doc_cnss', label: 'Attestation CNSS', required: false },
  { key: 'doc_identity', label: "Piece d'identite du representant", required: true },
];

const sectors = [
  'Agriculture',
  'Agro-industrie',
  'Assurances',
  'Banques et Finance',
  'BTP / Construction',
  'Commerce general',
  'Communication / Media',
  'Consulting',
  'Eau et Assainissement',
  'Education / Formation',
  'Energie / Electricite',
  'Environnement',
  'Foresterie / Bois',
  'Hotellerie / Tourisme',
  'Immobilier',
  'Industrie manufacturiere',
  'Informatique / IT / Telecom',
  'Logistique / Transport',
  'Mines / Metallurgie',
  'Peches et Elevage',
  'Petrole et Gaz',
  'Pharmaceutique / Sante',
  'Restauration / Catering',
  'Securite',
  'Textile / Habillement',
  'Transports',
  'Travaux publics / Genie civil',
  'Autre'
];

const provinces = [
  'Bas-Uele', 'Equateur', 'Haut-Katanga', 'Haut-Lomami', 'Haut-Uele', 'Ituri',
  'Kasai', 'Kasai-Central', 'Kasai-Oriental', 'Kinshasa', 'Kongo Central',
  'Kwango', 'Kwilu', 'Lomami', 'Lualaba', 'Mai-Ndombe', 'Maniema', 'Mongala',
  'Nord-Kivu', 'Nord-Ubangi', 'Sankuru', 'Sud-Kivu', 'Sud-Ubangi', 'Tanganyika',
  'Tshopo', 'Tshuapa'
];

const companyTypes = ['Personne Physique', 'Personne Morale', 'Entreprenant', 'Formation Medicale', 'Autre'];

export function RegistrationRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'subcontractor' | 'prime'>('subcontractor');

  // Company details
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('Personne Morale');
  const [rccm, setRccm] = useState('');
  const [idNational, setIdNational] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [employees, setEmployees] = useState('');

  // Ownership
  const [congoleseCapital, setCongoleseCapital] = useState(51);
  const [personnelCongolais, setPersonnelCongolais] = useState(true);
  const [experience, setExperience] = useState<string[]>([]);

  // Documents
  const [docs, setDocs] = useState<Record<string, File | null>>({});

  const steps = [
    { label: 'Compte', fields: ['email', 'password', 'fullName'] },
    { label: 'Entreprise', fields: ['companyName', 'rccm', 'sector', 'province'] },
    { label: 'Propriete', fields: ['congoleseCapital'] },
    { label: 'Documents', fields: ['doc_rccm', 'doc_fiscal', 'doc_identity'] },
    { label: 'Revision', fields: [] },
  ];

  function validateStep() {
    if (step === 0) return email && password && password.length >= 6 && password === confirmPassword && fullName;
    if (step === 1) return companyName && rccm && idNational && sector && province;
    if (step === 2) return congoleseCapital >= 51;
    if (step === 3) {
      return docFields.filter(f => f.required).every(f => docs[f.key]);
    }
    return true;
  }

  async function uploadDocument(file: File, prefix: string): Promise<string | null> {
    const fileName = `${prefix}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('Documents').upload(fileName, file);
    if (error) return null;
    const { data: urlData } = supabase.storage.from('Documents').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleSubmit() {
    setUploading(true);
    setError('');

    // Upload documents
    const docUrls: Record<string, string> = {};
    for (const [key, file] of Object.entries(docs)) {
      if (file) {
        const url = await uploadDocument(file, key);
        if (!url) {
          setError(`Erreur upload: ${key}`);
          setUploading(false);
          return;
        }
        docUrls[key] = url;
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Erreur creation compte');
      setUploading(false);
      return;
    }

    // Insert user_profiles
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      status: 'pending',
      company_name: companyName,
      doc_rccm: docUrls.doc_rccm || null,
      doc_fiscal: docUrls.doc_fiscal || null,
      doc_cnss: docUrls.doc_cnss || null,
      doc_identity: docUrls.doc_identity || null,
    });

    if (profileError) {
      setError('Erreur sauvegarde profil');
      setUploading(false);
      return;
    }

    // Insert enterprise
    const { error: enterpriseError } = await supabase.from('enterprises').insert({
      user_id: authData.user.id,
      name: companyName,
      email,
      type: companyType,
      rccm,
      id_national: idNational,
      tax_number: taxNumber,
      sector,
      province,
      city,
      founded_year: foundedYear ? parseInt(foundedYear) : null,
      employees: employees ? parseInt(employees) : null,
      congolese_capital: congoleseCapital,
      experience,
      status: 'pending',
      doc_rccm: docUrls.doc_rccm || null,
      doc_fiscal: docUrls.doc_fiscal || null,
      doc_cnss: docUrls.doc_cnss || null,
      doc_identity: docUrls.doc_identity || null,
    });

    if (enterpriseError) {
  console.error('Enterprise insert error:', enterpriseError);
  setError(`Erreur: ${enterpriseError.message}`);
  setUploading(false);
  return;
}

    setSubmitted(true);
    setUploading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center card-shadow">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0a2540] mb-2">Demande soumise!</h2>
          <p className="text-gray-500 mb-4">
            Votre demande d'enregistrement est en cours de verification. 
            Numero de reference: <strong>ARSP-{Date.now().toString().slice(-6)}</strong>
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Delai moyen: 24-48 heures ouvrables
          </p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f]">
            Retour a l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Enregistrement ARSP</h1>
          <p className="text-gray-500">Etape {step + 1} sur {steps.length}: {steps[step].label}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-[#007FFF]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 card-shadow">

          {/* Step 0: Account */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">1. Informations du compte</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setRole('subcontractor')} className={`p-3 rounded-lg border-2 text-center transition-all ${role === 'subcontractor' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}>
                    <div className="font-medium text-[#0a2540]">Sous-traitant</div>
                  </button>
                  <button onClick={() => setRole('prime')} className={`p-3 rounded-lg border-2 text-center transition-all ${role === 'prime' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}>
                    <div className="font-medium text-[#0a2540]">Donneur d'ordres</div>
                  </button>
                </div>
              </div>

              <input type="text" placeholder="Nom complet *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input type="email" placeholder="Email *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Mot de passe (min 6 caracteres) *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" placeholder="Confirmer le mot de passe *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>
          )}

          {/* Step 1: Company Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">2. Details de l'entreprise</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type d'entreprise</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {companyTypes.map((t) => (
                    <button key={t} onClick={() => setCompanyType(t)} className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${companyType === t ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nom de l'entreprise *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <input type="text" placeholder="RCCM *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={rccm} onChange={(e) => setRccm(e.target.value)} />
                <input type="text" placeholder="ID Nationale *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={idNational} onChange={(e) => setIdNational(e.target.value)} />
                <input type="text" placeholder="Numero d'impot (NIF)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white" value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Secteur *</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] bg-white" value={province} onChange={(e) => setProvince(e.target.value)}>
                  <option value="">Province *</option>
                  {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" placeholder="Ville" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Annee de creation" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} />
                <input type="number" placeholder="Nombre d'employes" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={employees} onChange={(e) => setEmployees(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Secteurs d'experience</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sectors.map((s) => (
                    <button key={s} type="button" onClick={() => {
                      setExperience(exp => exp.includes(s) ? exp.filter(e => e !== s) : [...exp, s]);
                    }} className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${experience.includes(s) ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ownership */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">3. Structure de propriete</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Capital congolais (%)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="0" max="100" value={congoleseCapital} onChange={(e) => setCongoleseCapital(parseInt(e.target.value))} className="flex-1 accent-[#007FFF]" />
                  <span className="text-lg font-bold text-[#0a2540] w-16 text-right">{congoleseCapital}%</span>
                </div>
                {congoleseCapital < 51 && <p className="text-xs text-red-500 mt-1">Le capital congolais doit etre d'au moins 51%.</p>}
                {congoleseCapital >= 51 && <p className="text-xs text-emerald-600 mt-1">Critere satisfait.</p>}
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="personnelCongolais" checked={personnelCongolais} onChange={(e) => setPersonnelCongolais(e.target.checked)} className="w-4 h-4 accent-[#007FFF]" />
                <label htmlFor="personnelCongolais" className="text-sm text-gray-700">Majorite du personnel est de nationalite congolaise</label>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">4. Documents requis</h3>
              <p className="text-sm text-gray-500 mb-4">Veuillez telecharger les documents pour verification.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docFields.map((field) => {
                  const uploaded = docs[field.key];
                  return (
                    <div key={field.key} className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploaded ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-[#007FFF]'}`}>
                      {uploaded ? <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" /> : <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />}
                      <p className="text-sm font-medium text-[#0a2540] mb-2">{field.label} {field.required && <span className="text-red-500">*</span>}</p>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={field.key} onChange={(e) => setDocs({ ...docs, [field.key]: e.target.files?.[0] || null })} />
                      <label htmlFor={field.key} className="cursor-pointer text-xs text-[#007FFF] hover:underline">
                        {uploaded ? uploaded.name : 'Cliquer pour uploader'}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-[#0a2540] mb-4">5. Revision et soumission</h3>
              
              <div className="bg-[#F6F9FC] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium">{role === 'subcontractor' ? 'Sous-traitant' : 'Donneur d\'ordres'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nom:</span><span className="font-medium">{fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Entreprise:</span><span className="font-medium">{companyName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">RCCM:</span><span className="font-medium">{rccm}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Secteur:</span><span className="font-medium">{sector}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Province:</span><span className="font-medium">{province}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Capital congolais:</span><span className="font-medium">{congoleseCapital}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Documents:</span><span className="font-medium">{Object.values(docs).filter(Boolean).length}/{docFields.length}</span></div>
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
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Precedent
            </button>
            
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} disabled={!validateStep()} className="flex items-center gap-2 px-6 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] disabled:opacity-40">
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={uploading} className="flex items-center gap-2 px-6 py-2 bg-[#007FFF] text-white rounded-lg text-sm font-medium hover:bg-[#0066CC] disabled:opacity-40">
                {uploading ? 'Envoi...' : 'Soumettre'} <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}