import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle } from 'lucide-react';

export function VerifyCard() {
  const { arspId } = useParams<{ arspId: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const { data } = await supabase
        .from('digital_ids')
        .select('*, enterprises(*)')
        .eq('arsp_id', arspId)
        .single();
      
      setResult(data);
      setLoading(false);
    }
    verify();
  }, [arspId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#007FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verification en cours...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center card-shadow">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0a2540] mb-2">Carte invalide</h2>
          <p className="text-gray-500 text-sm">
            Ce numero ARSP n'existe pas dans notre base de donnees. 
            Verifiez le code ou contactez l'ARSP.
          </p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(result.valid_until) < new Date();
  const enterprise = result.enterprises;

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full card-shadow">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0a2540]">Carte verifiee</h2>
          <p className="text-sm text-gray-500">Cette carte ARSP est authentique</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Entreprise</span>
            <span className="font-semibold text-[#0a2540]">{enterprise?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">ID ARSP</span>
            <span className="font-semibold text-[#0a2540]">{result.arsp_id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">RCCM</span>
            <span className="font-semibold text-[#0a2540]">{enterprise?.rccm || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Secteur</span>
            <span className="font-semibold text-[#0a2540]">{enterprise?.sector || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Province</span>
            <span className="font-semibold text-[#0a2540]">{enterprise?.province || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Validite</span>
            <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
              {isExpired ? 'Expiree' : 'Valide'} ({new Date(result.valid_from).toLocaleDateString('fr-FR')} - {new Date(result.valid_until).toLocaleDateString('fr-FR')})
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Capital congolais</span>
            <span className="font-semibold text-[#0a2540]">{enterprise?.congolese_capital}%</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Verifie sur le Portail Numerique ARSP
          </p>
        </div>
      </div>
    </div>
  );
}