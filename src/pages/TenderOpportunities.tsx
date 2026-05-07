import { useState, useEffect } from 'react';
import { Search, Bell, Calendar, MapPin, Plus, X, Upload, Send, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function TenderOpportunities() {
  const auth = useAuth();
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [newTender, setNewTender] = useState({
    title: '', description: '', sector: '', province: '',
    budget: '', deadline: '', requirements: '',
  });

  const [bid, setBid] = useState({
    enterprise_name: '', enterprise_email: '',
    offer_amount: '', comment: '',
  });

  useEffect(() => {
    fetchTenders();
  }, []);

  async function fetchTenders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTenders(data);
    setLoading(false);
  }

  async function handleCreateTender() {
    const { error } = await supabase.from('tenders').insert([{
      title: newTender.title,
      description: newTender.description,
      sector: newTender.sector,
      province: newTender.province,
      budget: newTender.budget,
      deadline: newTender.deadline,
      requirements: newTender.requirements.split(',').map(r => r.trim()),
      status: 'open',
    }]);
    if (!error) {
      setShowCreate(false);
      setNewTender({ title: '', description: '', sector: '', province: '', budget: '', deadline: '', requirements: '' });
      fetchTenders();
    }
  }

  async function handleSubmitBid() {
    const { error } = await supabase.from('bids').insert([{
      tender_id: showApply,
      enterprise_name: bid.enterprise_name,
      enterprise_email: bid.enterprise_email,
      offer_amount: parseFloat(bid.offer_amount),
      comment: bid.comment,
      status: 'pending',
    }]);
    if (!error) {
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowApply(null);
        setSubmitSuccess(false);
        setBid({ enterprise_name: '', enterprise_email: '', offer_amount: '', comment: '' });
      }, 2000);
    }
  }

  const filtered = tenders.filter(t =>
    !query || t.title?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="relative h-48 rounded-xl overflow-hidden mb-6">
        <img src="/mining-sector.jpeg" alt="Mines" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0a2540]/60 flex items-center justify-between px-8">
          <h2 className="text-3xl font-bold text-white">Appels d'Offres</h2>
          {auth.userRole === 'prime' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#007FFF] text-white rounded-lg font-medium hover:bg-[#0066CC] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un appel d'offres
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 card-shadow mb-6">
        <div className="flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Rechercher un appel d'offres..."
            className="flex-1 bg-transparent py-2 text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tenders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun appel d'offres disponible</p>
          {auth.userRole === 'prime' && (
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">
              Créer le premier appel d'offres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-[#0a2540]">{t.title}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Ouvert</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{t.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {t.sector && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{t.sector}</span>}
                    {t.province && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.province}</span>}
                    {t.deadline && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1"><Calendar className="w-3 h-3" />Clôture: {t.deadline}</span>}
                    {t.budget && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">Budget: {t.budget}</span>}
                  </div>
                </div>
                {auth.userRole === 'subcontractor' && (
                  <button
                    onClick={() => setShowApply(t.id)}
                    className="px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f] transition-colors flex items-center gap-2"
                  >
                    Postuler <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tender Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Créer un appel d'offres</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Titre *" value={newTender.title} onChange={(e) => setNewTender({...newTender, title: e.target.value})} />
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-20 resize-none" placeholder="Description" value={newTender.description} onChange={(e) => setNewTender({...newTender, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Secteur" value={newTender.sector} onChange={(e) => setNewTender({...newTender, sector: e.target.value})} />
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Province" value={newTender.province} onChange={(e) => setNewTender({...newTender, province: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Budget (ex: $500,000)" value={newTender.budget} onChange={(e) => setNewTender({...newTender, budget: e.target.value})} />
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newTender.deadline} onChange={(e) => setNewTender({...newTender, deadline: e.target.value})} />
                </div>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Exigences (séparées par des virgules)" value={newTender.requirements} onChange={(e) => setNewTender({...newTender, requirements: e.target.value})} />
                <button onClick={handleCreateTender} className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] transition-colors">
                  Publier l'appel d'offres
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowApply(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0a2540]">Soumettre une candidature</h3>
                <button onClick={() => setShowApply(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-[#0a2540] mb-2">Candidature soumise!</h4>
                  <p className="text-gray-500 text-sm">Le donneur d'ordres sera notifié.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Nom de l'entreprise *" value={bid.enterprise_name} onChange={(e) => setBid({...bid, enterprise_name: e.target.value})} />
                  <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Email *" value={bid.enterprise_email} onChange={(e) => setBid({...bid, enterprise_email: e.target.value})} />
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Offre financière (USD)" value={bid.offer_amount} onChange={(e) => setBid({...bid, offer_amount: e.target.value})} />
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF] h-20 resize-none" placeholder="Commentaire / proposition" value={bid.comment} onChange={(e) => setBid({...bid, comment: e.target.value})} />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#007FFF]">
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Dossier technique (PDF)</p>
                  </div>
                  <button onClick={handleSubmitBid} className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] transition-colors flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Soumettre ma candidature
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