import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  Search, Filter, Plus, FileText, Calendar, DollarSign, MapPin, ChevronRight,
  X, Send, Upload, CheckCircle, AlertCircle, Clock, Users, Eye, Trash2,
  Download, Briefcase, Building2, Mail, Phone, Loader2, Paperclip, Check
} from "lucide-react";
import { format, isPast, parseISO } from "date-fns";

export default function TenderOpportunities() {
  const { auth } = useAuth();
  const currentUserEmail = auth?.userEmail || "";
  const currentUserName = auth?.userName || currentUserEmail;
  const isAdmin = auth?.role === "admin";
  const isPrime = auth?.role === "prime";

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

  // Create tender form
  const [newTender, setNewTender] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    location: "",
    requirements: "",
    contact_email: currentUserEmail,
    document_file: null,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  // Apply form
  const [applyForm, setApplyForm] = useState({
    enterprise_name: currentUserName,
    enterprise_email: currentUserEmail,
    contact_name: "",
    contact_phone: "",
    proposal_summary: "",
    proposed_amount: "",
    document_file: null,
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyErrors, setApplyErrors] = useState({});
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const fileInputRef = useRef(null);
  const applyFileInputRef = useRef(null);

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
        t.location?.toLowerCase().includes(q)
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
    if (!newTender.budget || parseFloat(newTender.budget) <= 0) errors.budget = "Le budget doit etre superieur a 0";
    if (!newTender.deadline) errors.deadline = "La date limite est requise";
    if (newTender.deadline && isPast(parseISO(newTender.deadline))) errors.deadline = "La date limite doit etre dans le futur";
    if (!newTender.location.trim()) errors.location = "Le lieu est requis";
    if (!newTender.contact_email.trim()) errors.contact_email = "L'email de contact est requis";
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateTender(e) {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setCreateLoading(true);
    try {
      let documentUrl = "";
      if (newTender.document_file) {
        const fileName = `tender_${Date.now()}_${newTender.document_file.name}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from("tender_documents")
          .upload(fileName, newTender.document_file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("tender_documents")
          .getPublicUrl(fileName);
        documentUrl = urlData.publicUrl;
      }

      const requirements = newTender.requirements
        .split(",")
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const { error } = await supabase.from("tenders").insert([{
        title: newTender.title.trim(),
        description: newTender.description.trim(),
        budget: parseFloat(newTender.budget),
        deadline: newTender.deadline,
        location: newTender.location.trim(),
        requirements: requirements.length > 0 ? requirements : [],
        contact_email: newTender.contact_email.trim(),
        document_url: documentUrl,
        created_by: currentUserEmail,
        status: "open",
      }]);

      if (error) throw error;

      showToast("Appel d'offres cree avec succes");
      setShowCreateModal(false);
      setNewTender({
        title: "", description: "", budget: "", deadline: "",
        location: "", requirements: "", contact_email: currentUserEmail, document_file: null,
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
      contact_name: "",
      contact_phone: "",
      proposal_summary: "",
      proposed_amount: "",
      document_file: null,
    });
    setApplyErrors({});
    setShowApplyModal(true);
  }

  function validateApplyForm() {
    const errors = {};
    if (!applyForm.enterprise_name.trim()) errors.enterprise_name = "Le nom de l'entreprise est requis";
    if (!applyForm.enterprise_email.trim()) errors.enterprise_email = "L'email est requis";
    if (!applyForm.contact_name.trim()) errors.contact_name = "Le nom du contact est requis";
    if (!applyForm.proposal_summary.trim()) errors.proposal_summary = "Le resume de la proposition est requis";
    if (!applyForm.proposed_amount || parseFloat(applyForm.proposed_amount) <= 0) errors.proposed_amount = "Le montant propose doit etre superieur a 0";
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
      let documentUrl = "";
      if (applyForm.document_file) {
        const fileName = `bid_${Date.now()}_${applyForm.document_file.name}`;
        const { data: upData, error: upErr } = await supabase.storage
          .from("bid_documents")
          .upload(fileName, applyForm.document_file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("bid_documents")
          .getPublicUrl(fileName);
        documentUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("bids").insert([{
        tender_id: selectedTender.id,
        enterprise_name: applyForm.enterprise_name.trim(),
        enterprise_email: applyForm.enterprise_email.trim(),
        contact_name: applyForm.contact_name.trim(),
        contact_phone: applyForm.contact_phone.trim(),
        proposal_summary: applyForm.proposal_summary.trim(),
        proposed_amount: parseFloat(applyForm.proposed_amount),
        document_url: documentUrl,
        status: "pending",
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
        .order("created_at", { ascending: false });
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
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

      {/* Filters */}
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

      {/* Stats */}
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

      {/* Tender List */}
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
                        Budget: {parseFloat(tender.budget).toLocaleString()} USD
                      </span>
                    )}
                    {tender.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-orange-500" />
                        Limite: {format(parseISO(tender.deadline), "dd/MM/yyyy")}
                      </span>
                    )}
                    {tender.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-blue-500" />
                        {tender.location}
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
                  {isPrime && tender.created_by === currentUserEmail && (
                    <button
                      onClick={() => openBidsModal(tender)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Users size={16} />
                      Voir candidatures
                    </button>
                  )}
                  {isPrime && tender.created_by === currentUserEmail && (
                    <button
                      onClick={() => handleDeleteTender(tender.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                  {(!isPrime || !tender.created_by || tender.created_by !== currentUserEmail) && tender.isOpen && (
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

      {/* Create Tender Modal */}
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
                    type="number"
                    min="0"
                    step="0.01"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTender.location}
                  onChange={e => setNewTender({ ...newTender, location: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.location ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Ex: Kinshasa, RDC"
                />
                {createErrors.location && <p className="text-red-500 text-xs mt-1">{createErrors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de contact <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newTender.contact_email}
                  onChange={e => setNewTender({ ...newTender, contact_email: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    createErrors.contact_email ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="contact@entreprise.com"
                />
                {createErrors.contact_email && <p className="text-red-500 text-xs mt-1">{createErrors.contact_email}</p>}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Document de l'appel d'offres (PDF, DOC)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">
                    {newTender.document_file ? newTender.document_file.name : "Cliquez pour telecharger un document"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setNewTender({ ...newTender, document_file: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                </div>
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

      {/* Apply Modal */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du contact <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={applyForm.contact_name}
                      onChange={e => setApplyForm({ ...applyForm, contact_name: e.target.value })}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        applyErrors.contact_name ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Nom complet"
                    />
                    {applyErrors.contact_name && <p className="text-red-500 text-xs mt-1">{applyErrors.contact_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telephone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={applyForm.contact_phone}
                        onChange={e => setApplyForm({ ...applyForm, contact_phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+243 ..."
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Resume de la proposition <span className="text-red-500">*</span></label>
                  <textarea
                    value={applyForm.proposal_summary}
                    onChange={e => setApplyForm({ ...applyForm, proposal_summary: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      applyErrors.proposal_summary ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Decrivez votre approche, votre experience et vos atouts..."
                  />
                  {applyErrors.proposal_summary && <p className="text-red-500 text-xs mt-1">{applyErrors.proposal_summary}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant propose (USD) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={applyForm.proposed_amount}
                      onChange={e => setApplyForm({ ...applyForm, proposed_amount: e.target.value })}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        applyErrors.proposed_amount ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="45000"
                    />
                  </div>
                  {applyErrors.proposed_amount && <p className="text-red-500 text-xs mt-1">{applyErrors.proposed_amount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Document de candidature (PDF, DOC)</label>
                  <div
                    onClick={() => applyFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Paperclip className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-gray-600">
                      {applyForm.document_file ? applyForm.document_file.name : "Cliquez pour joindre un document"}
                    </p>
                    <input
                      ref={applyFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setApplyForm({ ...applyForm, document_file: e.target.files?.[0] || null })}
                      className="hidden"
                    />
                  </div>
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

      {/* Detail Modal */}
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
                    {selectedTender.budget ? parseFloat(selectedTender.budget).toLocaleString() + " USD" : "Non specifie"}
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
                    <span>Lieu</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedTender.location || "Non specifie"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Mail size={16} />
                    <span>Contact</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedTender.contact_email || "Non specifie"}</p>
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
              {selectedTender.document_url && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Document</h3>
                  <a
                    href={selectedTender.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Download size={16} />
                    Telecharger le document de l'appel d'offres
                  </a>
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

      {/* Bids Modal */}
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
                            {bid.contact_name && (
                              <span className="flex items-center gap-1.5">
                                <Users size={14} className="text-gray-400" />
                                {bid.contact_name}
                              </span>
                            )}
                            {bid.contact_phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone size={14} className="text-gray-400" />
                                {bid.contact_phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <DollarSign size={14} className="text-green-600" />
                              {parseFloat(bid.proposed_amount).toLocaleString()} USD
                            </span>
                          </div>
                          {bid.proposal_summary && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                              <p className="font-medium text-gray-600 mb-1">Proposition:</p>
                              {bid.proposal_summary}
                            </div>
                          )}
                          {bid.document_url && (
                            <a
                              href={bid.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Download size={14} />
                              Voir le document de candidature
                            </a>
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