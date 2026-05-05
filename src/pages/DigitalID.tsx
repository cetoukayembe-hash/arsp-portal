import { Download, Printer, Share2, ShieldCheck, QrCode } from 'lucide-react';

export function DigitalID() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#0a2540] mb-6">Ma Carte Numérique ARSP</h2>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ID Card */}
        <div className="flex-1">
          <div className="bg-white rounded-xl overflow-hidden card-shadow max-w-[600px] mx-auto">
            {/* Top banner */}
            <div className="gradient-navy p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/arsp-logo.jpg" alt="ARSP" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
                <div>
                  <div className="font-bold text-sm">ARSP</div>
                  <div className="text-[10px] text-white/80 uppercase tracking-wider">Carte Numérique d'Identification</div>
                </div>
              </div>
              <ShieldCheck className="w-6 h-6 text-white/80" />
            </div>
            {/* Card body */}
            <div className="p-6 flex gap-6">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-2xl font-bold">
                  BC
                </div>
                <div className="w-20 h-20 bg-[#F6F9FC] rounded-lg flex items-center justify-center border border-gray-200">
                  <QrCode className="w-12 h-12 text-[#0a2540]" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Entreprise</div>
                  <div className="text-lg font-bold text-[#0a2540]">Bâtiments du Congo SARL</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">RCCM</div>
                    <div className="text-sm font-medium text-[#0a2540]">RCCM/KIN/2018-B-12345</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">ID ARSP</div>
                    <div className="text-sm font-medium text-[#0a2540]">ARSP-2023-001847</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Secteur</div>
                    <div className="text-sm font-medium text-[#0a2540]">Construction</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Province</div>
                    <div className="text-sm font-medium text-[#0a2540]">Kinshasa</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Validité</div>
                    <div className="text-sm font-medium text-[#0a2540]">15/03/2023 – 15/03/2026</div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">Agréé</span>
                </div>
              </div>
            </div>
            {/* Flag stripe */}
            <div className="flag-stripe h-1" />
            {/* Watermark */}
            <div className="px-6 py-2 bg-gray-50 text-center">
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.3em] uppercase">ARSP – Authentique – Vérifiable en ligne</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:w-64 space-y-3">
          <div className="bg-white rounded-xl p-4 card-shadow">
            <h4 className="text-sm font-semibold text-[#0a2540] mb-3">Actions</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h4 className="text-sm font-semibold text-[#0a2540] mb-2">Vérification</h4>
            <p className="text-xs text-gray-600 mb-2">Toute partie tierce peut vérifier l'authenticité de cette carte en scannant le QR code ou en visitant :</p>
            <code className="text-xs bg-white px-2 py-1 rounded text-[#007FFF] block">arsp.cd/verify/ARSP-2023-001847</code>
          </div>
        </div>
      </div>
    </div>
  );
}
