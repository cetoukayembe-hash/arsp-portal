import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const docFields = [
  { key: 'doc_rccm', label: 'RCCM', required: true },
  { key: 'doc_fiscal', label: 'Attestation Fiscale', required: true },
  { key: 'doc_cnss', label: 'Attestation CNSS', required: false },
  { key: 'doc_identity', label: 'Piece d\'identite', required: true },
];

export function RegistrationRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [rccm, setRccm] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [employees, setEmployees] = useState('');
  const [congoleseCapital, setCongoleseCapital] = useState('');
  const [role, setRole] = useState<'subcontractor' | 'prime'>('subcontractor');
  const [docs, setDocs] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

    // Check required docs
    for (const field of docFields) {
      if (field.required && !docs[field.key]) {
        setError(`Document requis: ${field.label}`);
        setUploading(false);
        return;
      }
    }

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

    // Insert user_profiles with pending status and company info
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

    // Insert enterprise record (also pending)
    const { error: enterpriseError } = await supabase.from('enterprises').insert({
      user_id: authData.user.id,
      name: companyName,
      email,
      rccm,
      tax_number: taxNumber,
      sector,
      province,
      employees: employees ? parseInt(employees) : null,
      congolese_capital: congoleseCapital ? parseInt(congoleseCapital) : null,
      status: 'pending',
      doc_rccm: docUrls.doc_rccm || null,
      doc_fiscal: docUrls.doc_fiscal || null,
      doc_cnss: docUrls.doc_cnss || null,
      doc_identity: docUrls.doc_identity || null,
    });

    if (enterpriseError) {
      setError('Erreur sauvegarde entreprise');
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
          <p className="text-gray-500 mb-6">
            Votre demande d'enregistrement est en cours de verification. Vous recevrez un email lorsque votre compte sera approuve.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f]"
          >
            Retour a l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9FC] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 card-shadow">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Enregistrement ARSP</h1>
            <p className="text-gray-500">Etape {step} sur 4</p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-[#007FFF]' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole('subcontractor')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${role === 'subcontractor' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium text-[#0a2540]">Sous-traitant</div>
                  </button>
                  <button
                    onClick={() => setRole('prime')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${role === 'prime' ? 'border-[#007FFF] bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium text-[#0a2540]">Donneur d'ordres</div>
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Nom complet *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Mot de passe (min 6 caracteres) *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!email || !password || password.length < 6 || !fullName}
                className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Company Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#0a2540]">Informations de l'entreprise</h3>
              <input
                type="text"
                placeholder="Nom de l'entreprise *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <input
                type="text"
                placeholder="RCCM *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
              />
              <input
                type="text"
                placeholder="Numero d'impot (NIF)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Secteur"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Province"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Nombre d'employes"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Capital congolais (%)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  value={congoleseCapital}
                  onChange={(e) => setCongoleseCapital(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!companyName || !rccm}
                  className="flex-1 py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Veuillez telecharger les documents requis pour verification.</p>
              {docFields.map((field) => (
                <div key={field.key} className="border-2 border-dashed rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#0a2540]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </span>
                    {docs[field.key] && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Charge
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id={field.key}
                    onChange={(e) => setDocs({ ...docs, [field.key]: e.target.files?.[0] || null })}
                  />
                  <label
                    htmlFor={field.key}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm cursor-pointer transition-all ${docs[field.key] ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F6F9FC] text-[#007FFF] hover:bg-blue-50'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {docs[field.key] ? docs[field.key]!.name : 'Cliquer pour uploader'}
                  </label>
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#F6F9FC] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium">{role === 'subcontractor' ? 'Sous-traitant' : 'Donneur d\'ordres'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nom:</span><span className="font-medium">{fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Entreprise:</span><span className="font-medium">{companyName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">RCCM:</span><span className="font-medium">{rccm}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium">{email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Documents:</span><span className="font-medium">{Object.values(docs).filter(Boolean).length}/{docFields.length}</span></div>
              </div>
              <p className="text-xs text-gray-500">
                En soumettant cette demande, vous acceptez que ARSP verifie vos documents. Le traitement peut prendre jusqu'a 48 heures ouvrables.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] disabled:opacity-50"
                >
                  {uploading ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}