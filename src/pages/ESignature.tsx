import { useState, useEffect, useRef } from 'react';
import { FileText, PenTool, CheckCircle2, Clock, X, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function ESignature() {
  const auth = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [signerName, setSignerName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: con } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    const { data: sig } = await supabase.from('signatures').select('*');
    if (con) setContracts(con);
    if (sig) setSignatures(sig);
    setLoading(false);
  }

  function isSignedByUser(contractId: string) {
    return signatures.some(s => s.contract_id === contractId && s.signer_email === auth.userEmail);
  }

  function getContractSignatures(contractId: string) {
    return signatures.filter(s => s.contract_id === contractId);
  }

  function isFullySigned(contractId: string) {
    return getContractSignatures(contractId).length >= 2;
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0a2540';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() { setIsDrawing(false); }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function handleSign() {
    if (!selectedContract) return;
    setSigning(true);
    let signatureData = '';
    if (signatureType === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) signatureData = canvas.toDataURL();
    } else {
      signatureData = signerName;
    }
    const { error } = await supabase.from('signatures').insert([{
      contract_id: selectedContract.id,
      signer_email: auth.userEmail,
      signer_name: signerName || auth.userEmail,
      signer_role: auth.userRole,
      signature_data: signatureData,
    }]);
    if (!error) {
      await supabase.from('contracts').update({ status: 'active' }).eq('id', selectedContract.id);
      setSignSuccess(true);
      setTimeout(() => {
        setSelectedContract(null);
        setSignSuccess(false);
        setSigning(false);
        fetchData();
      }, 2000);
    }
    setSigning(false);
  }

  const eligibleContracts = contracts.filter(c => {
    if (auth.userRole === 'prime') return c.prime_email === auth.userEmail || c.prime_email === 'prime@arsp.cd';
    if (auth.userRole === 'subcontractor') return c.subcontractor_email === auth.userEmail;
    return true;
  });

  const docUrl = selectedContract ? (selectedContract.document_url || '') : '';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#0a2540] text-white flex items-center justify-center">
          <PenTool className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">E-Signature</h2>
          <p className="text-sm text-gray-500">Signez vos contrats electroniquement</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : eligibleContracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun contrat a signer</p>
          <p className="text-gray-400 text-sm mt-1">Les contrats qui vous sont assignes apparaitront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligibleContracts.map((contract) => {
            const signed = isSignedByUser(contract.id);
            const fully = isFullySigned(contract.id);
            const sigs = getContractSignatures(contract.id);
            const contractDocUrl = contract.document_url || '';
            return (
              <div key={contract.id} className="bg-white rounded-xl p-5 card-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-[#0a2540]">{contract.title}</h3>
                      {fully ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Signe</span>
                      ) : signed ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Votre signature apposee</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En attente de signature</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{contract.reference}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {contract.value && <span>USD {contract.value}</span>}
                      {contract.subcontractor_email && <span>{contract.subcontractor_email}</span>}
                    </div>
                    <div className="mt-3 flex gap-3">
                      <div className={`flex items-center gap-1 text-xs ${sigs.some(s => s.signer_role === 'prime') ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {sigs.some(s => s.signer_role === 'prime') ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        Donneur d ordres
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${sigs.some(s => s.signer_role === 'subcontractor') ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {sigs.some(s => s.signer_role === 'subcontractor') ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        Sous-traitant
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!signed && !fully && (
                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]"
                      >
                        <PenTool className="w-4 h-4" />
                        Signer
                      </button>
                    )}
                    {contractDocUrl !== '' && (
                      <a
                        href={contractDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                        Document
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContract(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Signer le contrat</h3>
                <button onClick={() => setSelectedContract(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              {signSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-[#0a2540] mb-2">Contrat signe avec succes!</h4>
                  <p className="text-gray-500 text-sm">Votre signature a ete enregistree.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#F6F9FC] rounded-lg p-3">
                    <p className="text-sm font-medium text-[#0a2540]">{selectedContract.title}</p>
                    <p className="text-xs text-gray-500">{selectedContract.reference}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Votre nom complet</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                      placeholder="Ex: Jean Kabongo"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSignatureType('draw')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${signatureType === 'draw' ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600'}`}
                    >
                      Dessiner
                    </button>
                    <button
                      onClick={() => setSignatureType('type')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${signatureType === 'type' ? 'border-[#007FFF] bg-blue-50 text-[#0a2540]' : 'border-gray-200 text-gray-600'}`}
                    >
                      Taper
                    </button>
                  </div>
                  {signatureType === 'draw' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">Zone de signature</label>
                        <button onClick={clearCanvas} className="text-xs text-red-500 hover:underline">Effacer</button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair bg-gray-50"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                      <p className="text-xs text-gray-400 mt-1">Dessinez votre signature dans la zone ci-dessus</p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Tapez votre signature</label>
                      <input
                        className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-2xl outline-none focus:border-[#007FFF] italic text-[#0a2540]"
                        placeholder="Votre signature"
                        style={{ fontFamily: 'cursive' }}
                      />
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      En signant ce document, vous acceptez les termes et conditions du contrat conformement a la loi congolaise.
                    </p>
                  </div>
                  <button
                    onClick={handleSign}
                    disabled={signing || !signerName}
                    className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] disabled:opacity-50"
                  >
                    {signing ? 'Signature en cours...' : 'Confirmer ma signature'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}