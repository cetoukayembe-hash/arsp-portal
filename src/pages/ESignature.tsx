import { useState, useRef } from 'react';
import { PenLine, Eraser, CheckCircle2, Download, Share2, ShieldCheck, Eye, Clock } from 'lucide-react';

export function ESignature() {
  const [signed, setSigned] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [sigType, setSigType] = useState<'draw' | 'type'>('draw');
  const [typedSig, setTypedSig] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0a2540';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = () => {
    setSigned(true);
    setShowSignature(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">E-Signature</h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Document Viewer */}
        <div className="flex-1">
          <div className="bg-white rounded-xl card-shadow overflow-hidden">
            {signed && (
              <div className="bg-emerald-500 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                SIGNÉ ÉLECTRONIQUEMENT – {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}
              </div>
            )}
            <div className="p-8 bg-[#F6F9FC]">
              <div className="bg-white shadow-lg mx-auto max-w-2xl p-8 min-h-[600px]">
                <div className="border-b-2 border-[#0a2540] pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/arsp-logo.jpg" alt="ARSP" className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-[#0a2540]">ARSP</div>
                        <div className="text-xs text-gray-500">Autorité de Régulation de la Sous-traitance</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Réf: CNT-2025-001</div>
                      <div>Date: 15/01/2025</div>
                    </div>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-[#0a2540] text-center mb-6">CONTRAT DE SOUS-TRAITANCE</h1>
                <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                  <p><strong>ENTRE</strong></p>
                  <p>La société <strong>MINERAIS & LOGISTIQUE SPRL</strong>, dont le siège social est situé à Lubumbashi, Haut-Katanga, représentée par Monsieur Patrick Mutombo, ci-après dénommée le <strong>« Donneur d'ordres »</strong>,</p>
                  <p className="text-center font-medium">ET</p>
                  <p>La société <strong>BÂTIMENTS DU CONGO SARL</strong>, dont le siège social est situé à Kinshasa, représentée par Monsieur Jean-Pierre M. Kabongo, ci-après dénommée le <strong>« Sous-traitant »</strong>,</p>
                  <p><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>
                  <p><strong>Article 1 – Objet du contrat</strong></p>
                  <p>Le présent contrat a pour objet la réalisation des travaux de construction d'un immeuble de bureaux dans la commune de Gombe, Kinshasa, conformément au cahier des charges annexé au présent contrat.</p>
                  <p><strong>Article 2 – Durée</strong></p>
                  <p>Le présent contrat est conclu pour une durée de 18 mois, à compter du 15 janvier 2025 au 30 juin 2026.</p>
                  <p><strong>Article 3 – Montant</strong></p>
                  <p>Le montant total des travaux est fixé à <strong>1 800 000 USD</strong> (un million huit cent mille dollars américains), payable selon l'échéancier joint.</p>
                  <p><strong>Article 4 – Conditions de sous-traitance</strong></p>
                  <p>Le Sous-traitant s'engage à respecter les obligations légales prévues par la loi n°17/001 du 08 février 2017, notamment le respect du contenu local et la priorité aux ressources humaines congolaises.</p>
                  <p><strong>Article 5 – Signature</strong></p>
                  <p>Les parties déclarent avoir pris connaissance de l'intégralité du présent contrat et l'acceptent en toutes ses clauses et conditions.</p>
                </div>

                {/* Signature area */}
                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Pour le Donneur d'ordres</p>
                    <div className="h-16 border-b border-gray-300" />
                    <p className="text-sm font-medium text-[#0a2540] mt-1">Patrick Mutombo</p>
                    <p className="text-xs text-gray-500">DG – Minerais & Logistique SPRL</p>
                    {signed && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Signé électroniquement
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Pour le Sous-traitant</p>
                    <div className="h-16 border-b border-gray-300 flex items-end">
                      {signed && typedSig && (
                        <p className="text-2xl font-bold text-[#0a2540]" style={{ fontFamily: 'cursive' }}>{typedSig}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#0a2540] mt-1">Jean-Pierre M. Kabongo</p>
                    <p className="text-xs text-gray-500">DG – Bâtiments du Congo SARL</p>
                    {signed && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Signé électroniquement
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Panel */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="font-semibold text-[#0a2540] mb-4">Signer électroniquement</h3>
            <div className="bg-[#F6F9FC] rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-500 mb-1">Identité du signataire</div>
              <div className="text-sm font-medium text-[#0a2540]">Jean-Pierre M. Kabongo</div>
              <div className="text-xs text-gray-500">Directeur Général</div>
              <div className="text-xs text-gray-500">Bâtiments du Congo SARL</div>
              <div className="text-xs text-gray-500">IDNAT-001-234-567</div>
            </div>
            <div className="flex items-start gap-2 mb-4">
              <input type="checkbox" id="readDoc" className="w-4 h-4 mt-0.5 accent-[#007FFF]" />
              <label htmlFor="readDoc" className="text-sm text-gray-700">
                Je certifie avoir lu et approuvé le document ci-contre.
              </label>
            </div>
            {!signed ? (
              <button
                onClick={() => setShowSignature(true)}
                className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] transition-colors flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" />
                Appliquer la signature
              </button>
            ) : (
              <div className="text-center py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">Document signé</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString('fr-FR')}</p>
              </div>
            )}
          </div>

          {signed && (
            <div className="bg-white rounded-xl p-5 card-shadow space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> Télécharger signé
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" /> Partager
              </button>
              <div className="border-t border-gray-100 pt-3 mt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Audit trail</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-gray-600">Signé par Jean-Pierre M. Kabongo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">{new Date().toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">IP: 192.168.xxx.xxx (hash)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSignature(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#0a2540] mb-4">Votre signature</h3>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setSigType('draw')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${sigType === 'draw' ? 'bg-[#0a2540] text-white' : 'bg-gray-100 text-gray-600'}`}>Dessiner</button>
                <button onClick={() => setSigType('type')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${sigType === 'type' ? 'bg-[#0a2540] text-white' : 'bg-gray-100 text-gray-600'}`}>Taper</button>
              </div>
              {sigType === 'draw' ? (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl bg-[#F6F9FC]">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full rounded-xl cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  <button onClick={clearCanvas} className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-700">
                    <Eraser className="w-3 h-3" /> Effacer
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSig}
                    onChange={(e) => setTypedSig(e.target.value)}
                    placeholder="Tapez votre nom complet"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                  />
                  {typedSig && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <p className="text-3xl text-[#0a2540]" style={{ fontFamily: 'cursive' }}>{typedSig}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSignature(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                <button onClick={handleSign} className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg text-sm font-semibold hover:bg-[#0066CC] transition-colors">Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
