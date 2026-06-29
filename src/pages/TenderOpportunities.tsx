import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { supabase } from "@/lib/supabase";
import {
  Search, Filter, Plus, FileText, Calendar, DollarSign, MapPin,
  X, Send, CheckCircle, AlertCircle, Clock, Users, Eye, Trash2,
  Briefcase, Building2, Mail, Loader2, Check
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

export function TenderOpportunities() {
  const auth = useAuth();
  const currentUserEmail = auth?.userEmail || "";
  const currentUserName = auth?.userEmail?.split("@")[0] || "Utilisateur";
  const isAdmin = auth?.userRole === "admin";
  const isPrime = auth?.userRole === "prime";

  const [tenders, setTenders] = useState([]);
  const [filteredTenders, setFilteredTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [selectedTenderBids, setSelectedTenderBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [userBids, setUserBids] = useState([]);
  const [toast, setToast] = useState(null);

  const [newTender, setNewTender] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    province: "",
    sector: "",
    requirements: "",
    prime_contractor_email: currentUserEmail,
    prime_contractor_name: currentUserName,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  const [applyForm, setApplyForm] = useState({
    enterprise_name: currentUserName,
    enterprise_email: currentUserEmail,
    comment: "",
    offer_amount: "",
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyErrors, setApplyErrors] = useState({});
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    fetchTenders();
    if (currentUserEmail) fetchUserBids();
  }, [currentUserEmail]);

  useEffect(() => {
    filterTenders();
  }, [tenders, searchQuery, statusFilter]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchTenders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenders")
        .select("*, bids: bids(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched = (data || []).map(t => ({
        ...t,
        isOpen: !t.deadline || !isPast(parseISO(t.deadline)),
        bidCount: t.bids?.[0]?.count || 0,
      }));

      setTenders(enriched);
    } catch (err) {
      console.error("Error fetching tenders:", err);
      showToast("Erreur lors du chargement des appels d'offres", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserBids() {
    try {
      const { data, error } = await supabase
        .from("bids")
        .select("tender_id")
        .eq("enterprise_email", currentUserEmail);
      if (!error && data) {
        setUserBids(data.map(b => b.tender_id));
      }
    } catch (err) {
      console.error("Error fetching user bids:", err);
    }
  }

  function filterTenders() {
    let result = [...tenders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.province?.toLowerCase().includes(q) ||
        t.sector?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(t =>
        statusFilter === "open" ? t.isOpen : !t.isOpen
      );
    }
    setFilteredTenders(result);
  }

  function validateCreateForm() {
    const errors = {};
    if (!newTender.title.trim()) errors.title = "Le titre est requis";
    if (!newTender.description.trim()) errors.description = "La description est requise";
    if (!newTender.budget.trim()) errors.budget = "Le budget est requis";
    if (!newTender.deadline) errors.deadline = "La date limite est requise";
    if (newTender.deadline && isPast(parseISO(newTender.deadline))) errors.deadline = "La date limite doit etre dans le futur";
    if (!newTender.province.trim()) errors.province = "La province est requise";
    if (!newTender.sector.trim()) errors.sector = "Le secteur est requis";
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateTender(e) {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setCreateLoading(true);
    try {
      const requirements = newTender.requirements
        .split(",")
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const { error } = await supabase.from("tenders").insert([{
        title: newTender.title.trim(),
        description: newTender.description.trim(),
        budget: newTender.budget.trim(),
        deadline: newTender.deadline,
        province: newTender.province.trim(),
        sector: newTender.sector.trim(),
        requirements: requirements.length > 0 ? requirements : [],
        prime_contractor_email: newTender.prime_contractor_email.trim(),
        prime_contractor_name: newTender.prime_contractor_name.trim(),
        status: "open",
      }]);

      if (error) throw error;

      showToast("Appel d'offres cree avec succes");
      setShowCreateModal(false);
      setNewTender({
        title: "", description: "", budget: "", deadline: "",
        province: "", sector: "", requirements: "", prime_contractor_email: currentUserEmail, prime_contractor_name: currentUserName,
      });
      setCreateErrors({});
      fetchTenders();
    } catch (err) {
      console.error("Error creating tender:", err);
      showToast("Erreur lors de la creation: " + err.message, "error");
    } finally {
      setCreateLoading(false);
    }
  }

  function openApplyModal(tender) {
    setSelectedTender(tender);
    setAlreadyApplied(userBids.includes(tender.id));
    setApplyForm({
      enterprise_name: currentUserName,
      enterprise_email: currentUserEmail,
      comment: "",
      offer_amount: "",
    });
    setApplyErrors({});
    setShowApplyModal(true);
  }

  function validateApplyForm() {
    const errors = {};
    if (!applyForm.enterprise_name.trim()) errors.enterprise_name = "Le nom de l'entreprise est requis";
    if (!applyForm.enterprise_email.trim()) errors.enterprise_email = "L'email est requis";
    if (!applyForm.comment.trim()) errors.comment = "Le commentaire est requis";
    if (!applyForm.offer_amount || parseFloat(applyForm.offer_amount) <= 0) errors.offer_amount = "Le montant doit etre superieur a 0";
    setApplyErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitBid(e) {
    e.preventDefault();
    if (alreadyApplied) {
      showToast("Vous avez deja postule a cet appel d'offres", "error");
      return;
    }
    if (!validateApplyForm()) return;

    setApplyLoading(true);
    try {
      const { error } = await supabase.from("bids").insert([{
        tender_id: selectedTender.id,
        enterprise_name: applyForm.enterprise_name.trim(),
        enterprise_email: applyForm.enterprise_email.trim(),
        comment: applyForm.comment.trim(),
        offer_amount: parseFloat(applyForm.offer_amount),
        status: "pending",
        submitted_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      showToast("Candidature soumise avec succes");
      setShowApplyModal(false);
      setUserBids([...userBids, selectedTender.id]);
      fetchTenders();
    } catch (err) {
      console.error("Error submitting bid:", err);
      showToast("Erreur lors de la soumission: " + err.message, "error");
    } finally {
      setApplyLoading(false);
    }
  }

  async function openDetailModal(tender) {
    setSelectedTender(tender);
    setShowDetailModal(true);
  }

  async function openBidsModal(tender) {
    setSelectedTender(tender);
    setShowBidsModal(true);
    setBidsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("tender_id", tender.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setSelectedTenderBids(data || []);
    } catch (err) {
      console.error("Error fetching bids:", err);
      showToast("Erreur lors du chargement des candidatures", "error");
    } finally {
      setBidsLoading(false);
    }
  }

  async function handleDeleteTender(tenderId) {
    if (!confirm("Voulez-vous vraiment supprimer cet appel d'offres ? Cette action est irreversible.")) return;
    try {
      const { error } = await supabase.from("tenders").delete().eq("id", tenderId);
      if (error) throw error;
      showToast("Appel d'offres supprime");
      fetchTenders();
    } catch (err) {
      console.error("Error deleting tender:", err);
      showToast("Erreur lors de la suppression", "error");
    }
  }

  async function handleUpdateBidStatus(bidId, status) {
    try {
      const { error } = await supabase.from("bids").update({ status }).eq("id", bidId);
      if (error) throw error;
      showToast(`Candidature ${status === "accepted" ? "acceptee" : "rejetee"}`);
      openBidsModal(selectedTender);
    } catch (err) {
      console.error("Error updating bid:", err);
      showToast("Erreur lors de la mise a jour", "error");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appels d'offres</h1>
          <p className="text-gray-500 mt-1">Consultez et postulez aux appels d'offres disponibles</p>
        </div>
        {isPrime && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Creer un appel d'offres
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par titre, description ou lieu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouverts</option>
            <option value="closed">Clotures</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText size={16} />
            <span>Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tenders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <Clock size={16} />
            <span>Ouverts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tenders.filter(t => t.isOpen).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users size={16} />
            <span>Candidatures</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tenders.reduce((sum, t) => sum + (t.bidCount || 0), 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
            <CheckCircle size={16} />
            <span>Mes candidatures</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{userBids.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="ml-3 text-gray-500">Chargement...</span>
        </div>
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">Aucun appel d'offres trouve</p>
          <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres ou revenez plus tard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTenders.map(tender => (
            <div
              key={tender.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tender.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tender.isOpen
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {tender.isOpen ? "Ouvert" : "Cloture"}
                    </span>
                    {userBids.includes(tender.id) && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Deja postule
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tender.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {tender.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-600" />
                        Budget: {tender.budget} USD
                      </span>
                    )}
                    {tender.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-orange-500" />
                        Limite: {format(parseISO(tender.deadline), "dd/MM/yyyy")}
                      </span>
                    )}
                    {(tender.province || tender.sector) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-blue-500" />
                        {[tender.province, tender.sector].filter(Boolean).join(" - ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-purple-500" />
                      {tender.bidCount || 0} candidature{tender.bidCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {tender.requirements && tender.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tender.requirements.map((req, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          {req}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 lg:items-start">
                  <button
                    onClick={() => openDetailModal(tender)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    Details
                  </button>
                  {isPrime && tender.prime_contractor_email === currentUserEmail && (
                    <>
                      <button
                        onClick={() => openBidsModal(tender)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Users size={16} />
                        Voir candidatures
                      </button>
                      <button
                        onClick={() => handleDeleteTender(tender.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </>
                  )}
                  {(!isPrime || !tender.prime_contractor_email || tender.prime_contractor_email !== currentUserEmail) && tender.isOpen && (
                    <button
                      onClick={() => openApplyModal(tender)}
                      disabled={userBids.includes(tender.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        userBids.includes(tender.id)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <Send size={16} />
                      {userBids.includes(tender.id) ? "Deja postule" : "Postuler"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Creer un appel d'offres</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateTender} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTender.title}
                  onChange={e => setNewTender({ ...newTender, title: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.title ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Ex: Construction d'un hopital"
                />
                {createErrors.title && <p className="text-red-500 text-xs mt-1">{createErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={newTender.description}
                  onChange={e => setNewTender({ ...newTender, description: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.description ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Decrivez le projet en detail..."
                />
                {createErrors.description && <p className="text-red-500 text-xs mt-1">{createErrors.description}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (USD) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newTender.budget}
                    onChange={e => setNewTender({ ...newTender, budget: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      createErrors.budget ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="50000"
                  />
                  {createErrors.budget && <p className="text-red-500 text-xs mt-1">{createErrors.budget}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date limite <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={newTender.deadline}
                    onChange={e => setNewTender({ ...newTender, deadline: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      createErrors.deadline ? "border-red-300" : "border-gray-200"
                    }`}
                  />
                  {createErrors.deadline && <p className="text-red-500 text-xs mt-1">{createErrors.deadline}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Province <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newTender.province}
                    onChange={e => setNewTender({ ...newTender, province: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      createErrors.province ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Ex: Kinshasa"
                  />
                  {createErrors.province && <p className="text-red-500 text-xs mt-1">{createErrors.province}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newTender.sector}
                    onChange={e => setNewTender({ ...newTender, sector: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      createErrors.sector ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Ex: Construction"
                  />
                  {createErrors.sector && <p className="text-red-500 text-xs mt-1">{createErrors.sector}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Exigences (separees par des virgules)</label>
                <input
                  type="text"
                  value={newTender.requirements}
                  onChange={e => setNewTender({ ...newTender, requirements: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Experience 5 ans, Certification ISO, etc."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {createLoading ? "Creation..." : "Creer l'appel d'offres"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApplyModal && selectedTender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Postuler</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedTender.title}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            {alreadyApplied ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Vous avez deja postule</h3>
                <p className="text-gray-500">Votre candidature a ete soumise pour cet appel d'offres.</p>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBid} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={applyForm.enterprise_name}
                        onChange={e => setApplyForm({ ...applyForm, enterprise_name: e.target.value })}
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          applyErrors.enterprise_name ? "border-red-300" : "border-gray-200"
                        }`}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    {applyErrors.enterprise_name && <p className="text-red-500 text-xs mt-1">{applyErrors.enterprise_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={applyForm.enterprise_email}
                        onChange={e => setApplyForm({ ...applyForm, enterprise_email: e.target.value })}
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          applyErrors.enterprise_email ? "border-red-300" : "border-gray-200"
                        }`}
                        placeholder="email@entreprise.com"
                      />
                    </div>
                    {applyErrors.enterprise_email && <p className="text-red-500 text-xs mt-1">{applyErrors.enterprise_email}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant de l'offre (USD) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={applyForm.offer_amount}
                      onChange={e => setApplyForm({ ...applyForm, offer_amount: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        applyErrors.offer_amount ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="45000"
                    />
                  </div>
                  {applyErrors.offer_amount && <p className="text-red-500 text-xs mt-1">{applyErrors.offer_amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Commentaire <span className="text-red-500">*</span></label>
                  <textarea
                    value={applyForm.comment}
                    onChange={e => setApplyForm({ ...applyForm, comment: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      applyErrors.comment ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Decrivez votre approche, votre experience et vos atouts..."
                  />
                  {applyErrors.comment && <p className="text-red-500 text-xs mt-1">{applyErrors.comment}</p>}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {applyLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {applyLoading ? "Envoi..." : "Soumettre la candidature"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDetailModal && selectedTender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{selectedTender.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedTender.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {selectedTender.isOpen ? "Ouvert" : "Cloture"}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedTender.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <DollarSign size={16} />
                    <span>Budget</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTender.budget ? selectedTender.budget + " USD" : "Non specifie"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar size={16} />
                    <span>Date limite</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTender.deadline ? format(parseISO(selectedTender.deadline), "dd/MM/yyyy") : "Non specifiee"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin size={16} />
                    <span>Province / Secteur</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {[selectedTender.province, selectedTender.sector].filter(Boolean).join(" - ") || "Non specifie"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Mail size={16} />
                    <span>Contact</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedTender.prime_contractor_email || "Non specifie"}</p>
                </div>
              </div>
              {selectedTender.requirements && selectedTender.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Exigences</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTender.requirements.map((req, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  <span>{selectedTender.bidCount || 0} candidature{selectedTender.bidCount !== 1 ? "s" : ""} soumise{selectedTender.bidCount !== 1 ? "s" : ""}</span>
                </div>
                {selectedTender.isOpen && !userBids.includes(selectedTender.id) && (
                  <button
                    onClick={() => { setShowDetailModal(false); openApplyModal(selectedTender); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Send size={16} />
                    Postuler
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBidsModal && selectedTender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Candidatures</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedTender.title}</p>
              </div>
              <button onClick={() => setShowBidsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {bidsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                  <span className="ml-3 text-gray-500">Chargement des candidatures...</span>
                </div>
              ) : selectedTenderBids.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 text-lg">Aucune candidature</p>
                  <p className="text-gray-400 text-sm mt-1">Les entreprises n'ont pas encore postule a cet appel d'offres</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTenderBids.map(bid => (
                    <div key={bid.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{bid.enterprise_name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              bid.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              bid.status === "accepted" ? "bg-green-100 text-green-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {bid.status === "pending" ? "En attente" :
                               bid.status === "accepted" ? "Acceptee" : "Rejetee"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1.5">
                              <Mail size={14} className="text-gray-400" />
                              {bid.enterprise_email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <DollarSign size={14} className="text-green-600" />
                              {parseFloat(bid.offer_amount).toLocaleString()} USD
                            </span>
                          </div>
                          {bid.comment && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                              <p className="font-medium text-gray-600 mb-1">Commentaire:</p>
                              {bid.comment}
                            </div>
                          )}
                        </div>
                        {bid.status === "pending" && (
                          <div className="flex md:flex-col gap-2">
                            <button
                              onClick={() => handleUpdateBidStatus(bid.id, "accepted")}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <Check size={16} />
                              Accepter
                            </button>
                            <button
                              onClick={() => handleUpdateBidStatus(bid.id, "rejected")}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <X size={16} />
                              Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenderOpportunities;