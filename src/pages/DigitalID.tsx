import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, Share2, Printer } from 'lucide-react';

export function DigitalID() {
  const [enterprise, setEnterprise] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnterprise() {
      const { data } = await supabase
        .from('enterprises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data[0]) setEnterprise(data[0]);
      setLoading(false);
    }
    fetchEnterprise();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'AR';
    return name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 text-gray-500">
        Chargement de votre carte...
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Ma Carte Numerique ARSP</h2>
        <div className="bg-white rounded-xl p-8 text-center card-shadow">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🪪</span>
          </div>
          <h3 className="text-lg font-semibold text-[#0a2540] mb-2">Aucune entreprise enregistree</h3>
          <p className="text-gray-500 text-sm mb-4">Vous devez d'abord completer votre inscription pour obtenir votre carte numerique.</p>
          <a href="/register" className="px-6 py-2 bg-[#007FFF] text-white rounded-lg text-sm font-medium hover:bg-[#0066CC]">
            S'inscrire maintenant
          </a>
        </div>
      </div>
    );
  }

  const arspId = 'ARSP-' + enterprise.created_at?.substring(0, 4) + '-' + enterprise.id?.substring(0, 6).toUpperCase();
  const validFrom = formatDate(enterprise.created_at);
  const validUntil = new Date(enterprise.created_at);
  validUntil.setFullYear(validUntil.getFullYear() + 3);
  const validUntilStr = validUntil.toLocaleDateString('fr-FR');

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Ma Carte Numerique ARSP</h2>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ID Card */}
        <div className="flex-1">
          <div className="bg-white rounded-xl overflow-hidden card-shadow max-w-[400px] mx-auto">
            {/* Header */}
            <div className="bg-[#0a2540] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                <div>
                  <div className="text-white font-bold text-sm">ARSP</div>
                  <div className="text-blue-200 text-[10px]">Portail Numerique</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white text-[10px] font-medium uppercase tracking-wider">Carte Numerique</div>
                <div className="text-blue-200 text-[10px]">d'Identification</div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-[#0a2540] text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {getInitials(enterprise.name)}
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Entreprise</div>
                  <div className="font-bold text-[#0a2540] text-sm leading-tight">{enterprise.name}</div>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      enterprise.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      enterprise.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {enterprise.status === 'active' ? 'Agree' : enterprise.status === 'pending' ? 'En attente' : 'Suspendu'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="bg-[#F6F9FC] rounded-lg p-2">
                  <div className="text-gray-400 uppercase tracking-wider mb-1">RCCM</div>
                  <div className="font-medium text-[#0a2540]">{enterprise.rccm || 'N/A'}</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-2">
                  <div className="text-gray-400 uppercase tracking-wider mb-1">ID ARSP</div>
                  <div className="font-medium text-[#0a2540]">{arspId}</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-2">
                  <div className="text-gray-400 uppercase tracking-wider mb-1">Secteur</div>
                  <div className="font-medium text-[#0a2540]">{enterprise.sector || 'N/A'}</div>
                </div>
                <div className="bg-[#F6F9FC] rounded-lg p-2">
                  <div className="text-gray-400 uppercase tracking-wider mb-1">Province</div>
                  <div className="font-medium text-[#0a2540]">{enterprise.province || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-[#F6F9FC] rounded-lg p-2 text-xs mb-4">
                <div className="text-gray-400 uppercase tracking-wider mb-1">Validite</div>
                <div className="font-medium text-[#0a2540]">{validFrom} - {validUntilStr}</div>
              </div>

              {/* QR Code placeholder */}
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-[#0a2540] rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-[#0a2540]'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">Capital congolais</div>
                  <div className="text-lg font-bold text-[#0a2540]">{enterprise.congolese_capital}%</div>
                  <div className="text-[10px] text-gray-400">{enterprise.type || 'Personne Morale'}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#0a2540] px-4 py-2 flex items-center justify-between">
              <div className="text-[10px] text-blue-200">arsp.cd/verify/{arspId}</div>
              <div className="text-[10px] text-blue-200">RDC</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 max-w-[400px] mx-auto">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]">
              <Download className="w-4 h-4" />
              Telecharger
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:w-64 space-y-4">
          <div className="bg-white rounded-xl p-4 card-shadow">
            <h4 className="text-sm font-semibold text-[#0a2540] mb-3">Informations</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="font-medium text-[#0a2540]">{enterprise.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Employes</span>
                <span className="font-medium text-[#0a2540]">{enterprise.employees || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Annee</span>
                <span className="font-medium text-[#0a2540]">{enterprise.founded_year || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NIF</span>
                <span className="font-medium text-[#0a2540]">{enterprise.tax_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 card-shadow">
            <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Verification</h4>
            <p className="text-xs text-gray-600 mb-2">Toute partie tierce peut verifier l'authenticite de cette carte en visitant:</p>
            <code className="text-xs bg-[#F6F9FC] px-2 py-1 rounded text-[#007FFF] block break-all">
              arsp.cd/verify/{arspId}
            </code>
          </div>

          {enterprise.experience && enterprise.experience.length > 0 && (
            <div className="bg-white rounded-xl p-4 card-shadow">
              <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Experience</h4>
              <div className="flex flex-wrap gap-1">
                {enterprise.experience.map((exp: string) => (
                  <span key={exp} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{exp}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}