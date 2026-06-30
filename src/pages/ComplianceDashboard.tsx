import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/App";
import { logAudit } from "@/lib/audit";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, AlertTriangle, XCircle, Calendar, FileText, Upload,
  ShieldCheck, Clock, Bell, ChevronDown, ChevronUp, Download,
  Trash2, X, Loader2, Building2, Users, Search,
  AlertOctagon, FileCheck, Archive, Plus, Info, RefreshCw,
  BarChart3, Crown, User
} from "lucide-react";
import { format, differenceInDays, parseISO, isPast, isValid } from "date-fns";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface ComplianceDoc {
  id: string;
  name: string;
  type: "RCCM" | "FISCAL" | "CNSS" | "OHADA" | "ARSP" | "LICENCE" | "TAX" | "OTHER";
  expiry_date: string | null;
  document_url: string | null;
  status: "valid" | "expiring" | "expired" | "missing";
  uploaded_at: string;
  enterprise_email: string;
  enterprise_name?: string;
}

interface Obligation {
  id: string;
  title: string;
  description: string;
  deadline: string;
  done: boolean;
  category: "ARSP" | "TAX" | "CNSS" | "OHADA" | "LABOR" | "REPORT" | "CUSTOM";
  priority: "high" | "medium" | "low";
  enterprise_email: string;
  created_at: string;
}

interface EnterpriseProfile {
  id: string;
  name: string;
  congolese_capital: number;
  arsp_registered: boolean;
  arsp_certificate_url: string | null;
  arsp_expiry: string | null;
  sector: string;
  province: string;
  status: string;
  email: string;
  role: string;
  rccm_number?: string;
  id_nat?: string;
  tax_id?: string;
}

interface SubcontractorCheck {
  id: string;
  name: string;
  contract_value: number;
  total_contract_value: number;
  congolese_owned: boolean;
  arsp_registered: boolean;
  status: "compliant" | "warning" | "non_compliant";
  prime_email: string;
  prime_name?: string;
  created_at: string;
  sector: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function getDocTypeLabel(type: string) {
  const map: Record<string, string> = {
    RCCM: "RCCM (Registre Commerce)",
    FISCAL: "Attestation Fiscale (DGI)",
    CNSS: "Attestation CNSS",
    OHADA: "Attestation OHADA",
    ARSP: "Certificat ARSP",
    LICENCE: "Licence Sectorielle",
    TAX: "Attestation Taxe",
    OTHER: "Autre Document",
  };
  return map[type] || type;
}

function getDocTypeIcon(type: string) {
  switch (type) {
    case "RCCM": return "🏢";
    case "FISCAL": return "📋";
    case "CNSS": return "👥";
    case "OHADA": return "📘";
    case "ARSP": return "🛡️";
    case "LICENCE": return "📜";
    case "TAX": return "💰";
    default: return "📄";
  }
}

function computeStatus(expiryDate: string | null): "valid" | "expiring" | "expired" | "missing" {
  if (!expiryDate) return "missing";
  const date = parseISO(expiryDate);
  if (!isValid(date)) return "missing";
  if (isPast(date)) return "expired";
  const daysLeft = differenceInDays(date, new Date());
  if (daysLeft <= 30) return "expiring";
  return "valid";
}

function getDaysRemaining(expiryDate: string | null): string {
  if (!expiryDate) return "Non defini";
  const date = parseISO(expiryDate);
  if (!isValid(date)) return "Date invalide";
  if (isPast(date)) {
    const days = Math.abs(differenceInDays(date, new Date()));
    return `Expire depuis ${days} jour${days > 1 ? "s" : ""}`;
  }
  const days = differenceInDays(date, new Date());
  if (days === 0) return "Expire aujourd'hui";
  if (days === 1) return "Expire demain";
  return `${days} jours restants`;
}

function getStatusConfig(status: string) {
  switch (status) {
    case "valid":
      return {
        icon: CheckCircle2, iconColor: "text-emerald-500", bg: "bg-emerald-50",
        text: "text-emerald-700", border: "border-emerald-200", badge: "Valide", progress: "bg-emerald-500",
      };
    case "expiring":
      return {
        icon: AlertTriangle, iconColor: "text-amber-500", bg: "bg-amber-50",
        text: "text-amber-700", border: "border-amber-200", badge: "Expire bientot", progress: "bg-amber-500",
      };
    case "expired":
      return {
        icon: XCircle, iconColor: "text-red-500", bg: "bg-red-50",
        text: "text-red-700", border: "border-red-200", badge: "Expire", progress: "bg-red-500",
      };
    default:
      return {
        icon: AlertOctagon, iconColor: "text-gray-400", bg: "bg-gray-50",
        text: "text-gray-600", border: "border-gray-200", badge: "Non fourni", progress: "bg-gray-400",
      };
  }
}

function getPriorityConfig(priority: string) {
  switch (priority) {
    case "high":
      return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Urgent" };
    case "medium":
      return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Important" };
    default:
      return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Normal" };
  }
}

function getScoreColor(score: number) {
  return score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
}
function getScoreBg(score: number) {
  return score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
}
function getScoreLabel(score: number) {
  return score >= 80 ? "Excellent" : score >= 60 ? "Moyen" : "Critique";
}

function getSubStatusConfig(status: string) {
  switch (status) {
    case "compliant":
      return { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Conforme" };
    case "warning":
      return { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Attention" };
    default:
      return { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Non conforme" };
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin": return { icon: Crown, color: "text-purple-600", bg: "bg-purple-50", label: "Admin" };
    case "prime": return { icon: Building2, color: "text-blue-600", bg: "bg-blue-50", label: "Prime" };
    default: return { icon: User, color: "text-gray-600", bg: "bg-gray-50", label: "Sous-traitant" };
  }
}
/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function ComplianceDashboard() {
  const auth = useAuth();
  const currentUserEmail = auth?.userEmail || "";
  const userRole = auth?.userRole || "subcontractor";
  const isAdmin = userRole === "admin";
  const isPrime = userRole === "prime";
  const isSub = userRole === "subcontractor";

  /* ─── Tabs ─── */
  const adminTabs = ["overview", "enterprises", "documents", "obligations", "subcontractors"] as const;
  const primeTabs = ["documents", "obligations", "subcontractors", "profile"] as const;
  const subTabs = ["documents", "obligations", "profile"] as const;

  const availableTabs = isAdmin ? adminTabs : isPrime ? primeTabs : subTabs;
  const [activeTab, setActiveTab] = useState<(typeof availableTabs)[number]>(availableTabs[0]);

  /* ─── Data ─── */
  const [documents, setDocuments] = useState<ComplianceDoc[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [enterprise, setEnterprise] = useState<EnterpriseProfile | null>(null);
  const [subcontractors, setSubcontractors] = useState<SubcontractorCheck[]>([]);
  const [allEnterprises, setAllEnterprises] = useState<EnterpriseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ─── Admin filters ─── */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "prime" | "subcontractor">("all");

  /* ─── Upload modal ─── */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("OTHER");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── Expanded doc rows ─── */
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  /* ─── Add obligation modal ─── */
  const [showAddObligation, setShowAddObligation] = useState(false);
  const [newObligation, setNewObligation] = useState({
    title: "", description: "", deadline: "", category: "CUSTOM" as const, priority: "medium" as const,
  });
  const [addingObligation, setAddingObligation] = useState(false);

  /* ─── Add subcontractor modal (prime only) ─── */
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSub, setNewSub] = useState({
    name: "", contract_value: "", total_contract_value: "", congolese_owned: false,
    arsp_registered: false, sector: "",
  });
  const [addingSub, setAddingSub] = useState(false);

  /* ─── Edit profile modal ─── */
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<EnterpriseProfile>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  /* ─── Alerts ─── */
  const [showAlerts, setShowAlerts] = useState(true);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => { if (currentUserEmail) fetchAllData(); }, [currentUserEmail]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const promises: Promise<void>[] = [
        fetchDocuments(),
        fetchObligations(),
        fetchEnterprise(),
      ];
      if (isPrime) promises.push(fetchSubcontractors());
      if (isAdmin) promises.push(fetchAllEnterprises(), fetchAllSubcontractors(), fetchAllDocuments(), fetchAllObligations());
      await Promise.all(promises);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Erreur lors du chargement des donnees", "error");
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showToast("Donnees actualisees");
  }

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("enterprise_email", currentUserEmail)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    setDocuments((data || []).map((d: any) => ({ ...d, status: computeStatus(d.expiry_date) })));
  }

  async function fetchAllDocuments() {
    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*, enterprises(name)")
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    setDocuments((data || []).map((d: any) => ({ ...d, status: computeStatus(d.expiry_date), enterprise_name: d.enterprises?.name })));
  }

  async function fetchObligations() {
    const { data, error } = await supabase
      .from("compliance_obligations")
      .select("*")
      .eq("enterprise_email", currentUserEmail)
      .order("deadline", { ascending: true });
    if (error) throw error;
    setObligations(data || []);
  }

  async function fetchAllObligations() {
    const { data, error } = await supabase
      .from("compliance_obligations")
      .select("*")
      .order("deadline", { ascending: true });
    if (error) throw error;
    setObligations(data || []);
  }

  async function fetchEnterprise() {
    const { data, error } = await supabase
      .from("enterprises")
      .select("*")
      .eq("email", currentUserEmail)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    setEnterprise(data || null);
  }

  async function fetchAllEnterprises() {
    const { data, error } = await supabase.from("enterprises").select("*").order("name", { ascending: true });
    if (error) throw error;
    setAllEnterprises(data || []);
  }

  async function fetchSubcontractors() {
    const { data, error } = await supabase
      .from("subcontractor_checks")
      .select("*")
      .eq("prime_email", currentUserEmail)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setSubcontractors(data || []);
  }

  async function fetchAllSubcontractors() {
    const { data, error } = await supabase
      .from("subcontractor_checks")
      .select("*, enterprises(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setSubcontractors((data || []).map((s: any) => ({ ...s, prime_name: s.enterprises?.name })));
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) { showToast("Veuillez selectionner un fichier", "error"); return; }
    setUploading(true);
    try {
      const fileName = `compliance_${Date.now()}_${uploadFile.name}`;
      const { error: upErr } = await supabase.storage.from("compliance_documents").upload(fileName, uploadFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("compliance_documents").getPublicUrl(fileName);
      const { data: insertedDoc, error: dbErr } = await supabase.from("compliance_documents").insert([{
        name: uploadFile.name, type: uploadDocType, expiry_date: uploadExpiry || null,
        document_url: urlData.publicUrl, enterprise_email: currentUserEmail,
        status: computeStatus(uploadExpiry),
      }]).select().single();
      if (dbErr) throw dbErr;
      showToast("Document telecharge avec succes");
      logAudit('UPLOAD', 'compliance_documents', insertedDoc?.id, {
        document_name: uploadFile.name,
        document_type: uploadDocType,
      });
      setShowUploadModal(false); setUploadFile(null); setUploadExpiry(""); setUploadDocType("OTHER");
      fetchDocuments();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
    finally { setUploading(false); }
  }

  async function handleDeleteDocument(docId: string, docUrl: string | null) {
    if (!confirm("Supprimer ce document ? Cette action est irreversible.")) return;
    try {
      if (docUrl) {
        const path = docUrl.split("/").pop();
        if (path) await supabase.storage.from("compliance_documents").remove([path]);
      }
      const { error } = await supabase.from("compliance_documents").delete().eq("id", docId);
      if (error) throw error;
      showToast("Document supprime");
      logAudit('DELETE', 'compliance_documents', docId);
      fetchDocuments();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
  }

  async function toggleObligation(id: string, current: boolean) {
    try {
      const { error } = await supabase.from("compliance_obligations").update({ done: !current }).eq("id", id);
      if (error) throw error;
      setObligations(prev => prev.map(o => o.id === id ? { ...o, done: !current } : o));
      showToast(current ? "Obligation reactivee" : "Obligation accomplie");
      logAudit('UPDATE', 'compliance_obligations', id, { done: !current });
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
  }

  async function handleAddObligation(e: React.FormEvent) {
    e.preventDefault();
    if (!newObligation.title.trim() || !newObligation.deadline) {
      showToast("Titre et date limite sont requis", "error"); return;
    }
    setAddingObligation(true);
    try {
      const { data: inserted, error } = await supabase.from("compliance_obligations").insert([{
        title: newObligation.title.trim(), description: newObligation.description.trim(),
        deadline: newObligation.deadline, done: false, category: newObligation.category,
        priority: newObligation.priority, enterprise_email: currentUserEmail,
      }]).select().single();
      if (error) throw error;
      showToast("Obligation ajoutee");
      logAudit('CREATE', 'compliance_obligations', inserted?.id, {
        title: newObligation.title,
        deadline: newObligation.deadline,
      });
      setShowAddObligation(false);
      setNewObligation({ title: "", description: "", deadline: "", category: "CUSTOM", priority: "medium" });
      fetchObligations();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
    finally { setAddingObligation(false); }
  }

  async function handleDeleteObligation(id: string) {
    if (!confirm("Supprimer cette obligation ?")) return;
    try {
      const { error } = await supabase.from("compliance_obligations").delete().eq("id", id);
      if (error) throw error;
      showToast("Obligation supprimee");
      logAudit('DELETE', 'compliance_obligations', id);
      fetchObligations();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
  }

  async function handleAddSubcontractor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSub.name.trim() || !newSub.contract_value || !newSub.total_contract_value) {
      showToast("Nom et montants sont requis", "error"); return;
    }
    const cv = parseFloat(newSub.contract_value);
    const tv = parseFloat(newSub.total_contract_value);
    if (cv <= 0 || tv <= 0 || cv > tv) { showToast("Montants invalides", "error"); return; }
    const ratio = (cv / tv) * 100;
    let status: "compliant" | "warning" | "non_compliant" = "compliant";
    if (ratio > 40) status = "non_compliant";
    else if (ratio > 30) status = "warning";
    if (!newSub.congolese_owned || !newSub.arsp_registered) status = "non_compliant";

    setAddingSub(true);
    try {
      const { data: inserted, error } = await supabase.from("subcontractor_checks").insert([{
        name: newSub.name.trim(), contract_value: cv, total_contract_value: tv,
        congolese_owned: newSub.congolese_owned, arsp_registered: newSub.arsp_registered,
        status, prime_email: currentUserEmail, sector: newSub.sector.trim() || "Non specifie",
      }]).select().single();
      if (error) throw error;
      showToast("Sous-traitant ajoute");
      logAudit('CREATE', 'subcontractor_checks', inserted?.id, {
        name: newSub.name,
        contract_ratio: ratio.toFixed(1) + '%',
        status,
      });
      setShowAddSub(false);
      setNewSub({ name: "", contract_value: "", total_contract_value: "", congolese_owned: false, arsp_registered: false, sector: "" });
      fetchSubcontractors();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
    finally { setAddingSub(false); }
  }

  async function handleDeleteSubcontractor(id: string) {
    if (!confirm("Supprimer ce sous-traitant ?")) return;
    try {
      const { error } = await supabase.from("subcontractor_checks").delete().eq("id", id);
      if (error) throw error;
      showToast("Sous-traitant supprime");
      logAudit('DELETE', 'subcontractor_checks', id);
      fetchSubcontractors();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (enterprise) {
        const { error } = await supabase.from("enterprises").update({
          name: editProfile.name, congolese_capital: editProfile.congolese_capital,
          arsp_registered: editProfile.arsp_registered, arsp_expiry: editProfile.arsp_expiry,
          sector: editProfile.sector, province: editProfile.province,
          rccm_number: editProfile.rccm_number, id_nat: editProfile.id_nat, tax_id: editProfile.tax_id,
        }).eq("id", enterprise.id);
        if (error) throw error;
        logAudit('UPDATE', 'enterprises', enterprise.id, { name: editProfile.name });
      } else {
        const { data: inserted, error } = await supabase.from("enterprises").insert([{ ...editProfile, email: currentUserEmail, status: "active" }]).select().single();
        if (error) throw error;
        logAudit('CREATE', 'enterprises', inserted?.id, { name: editProfile.name });
      }
      showToast("Profil mis a jour"); setShowEditProfile(false); fetchEnterprise();
    } catch (err: any) { showToast("Erreur: " + err.message, "error"); }
    finally { setSavingProfile(false); }
  }
    /* ═══════════════════════════════════════════════════════════════
     COMPUTED STATS
     ═══════════════════════════════════════════════════════════════ */
  const validDocs = documents.filter(d => d.status === "valid").length;
  const expiringDocs = documents.filter(d => d.status === "expiring").length;
  const expiredDocs = documents.filter(d => d.status === "expired").length;
  const missingDocs = documents.filter(d => d.status === "missing").length;
  const totalDocs = documents.length;
  const complianceScore = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 0;

  const doneObligations = obligations.filter(o => o.done).length;
  const totalObligations = obligations.length;
  const obligationProgress = totalObligations > 0 ? Math.round((doneObligations / totalObligations) * 100) : 0;

  const pendingObligations = obligations
    .filter(o => !o.done)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const nextDeadline = pendingObligations[0];
  const daysUntilNext = nextDeadline?.deadline ? differenceInDays(parseISO(nextDeadline.deadline), new Date()) : null;

  const compliantSubs = subcontractors.filter(s => s.status === "compliant").length;
  const warningSubs = subcontractors.filter(s => s.status === "warning").length;
  const nonCompliantSubs = subcontractors.filter(s => s.status === "non_compliant").length;
  const subcontractorScore = subcontractors.length > 0 ? Math.round((compliantSubs / subcontractors.length) * 100) : 0;

  const arspStatus = enterprise?.arsp_registered ? computeStatus(enterprise.arsp_expiry) : "missing";
  const arspConfig = getStatusConfig(arspStatus);
  const ArspIcon = arspConfig.icon;

  /* ─── Admin computed stats ─── */
  const totalEnterprises = allEnterprises.length;
  const primeCount = allEnterprises.filter(e => e.role === "prime").length;
  const subCount = allEnterprises.filter(e => e.role === "subcontractor").length;
  const registeredArspCount = allEnterprises.filter(e => e.arsp_registered).length;
  const globalComplianceScore = totalEnterprises > 0 ? Math.round((registeredArspCount / totalEnterprises) * 100) : 0;

  const filteredEnterprises = allEnterprises.filter(e => {
    const matchesSearch = !searchQuery || e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || e.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Urgent alerts
  const urgentAlerts = [
    ...expiredDocs > 0 ? [{ type: "error" as const, message: `${expiredDocs} document${expiredDocs > 1 ? "s" : ""} expire${expiredDocs > 1 ? "s" : ""} — action immediate requise` }] : [],
    ...expiringDocs > 0 ? [{ type: "warning" as const, message: `${expiringDocs} document${expiringDocs > 1 ? "s" : ""} expire${expiringDocs > 1 ? "s" : ""} bientot` }] : [],
    ...(nextDeadline && daysUntilNext !== null && daysUntilNext <= 7 && daysUntilNext >= 0)
      ? [{ type: "warning" as const, message: `Obligation urgente: "${nextDeadline.title}" dans ${daysUntilNext} jour${daysUntilNext > 1 ? "s" : ""}` }]
      : [],
    ...(nextDeadline && daysUntilNext !== null && daysUntilNext < 0)
      ? [{ type: "error" as const, message: `Obligation en retard: "${nextDeadline.title}"` }]
      : [],
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-gray-500">Chargement du tableau de bord...</span>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER: ADMIN VIEW
     ═══════════════════════════════════════════════════════════════ */
  if (isAdmin) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
            {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Admin — Conformite</h1>
            <p className="text-gray-500 mt-1">Vue d'ensemble de la conformite ARSP pour toutes les entreprises</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshData} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </div>

        {/* Admin KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Entreprises inscrites</span>
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">{totalEnterprises}</div>
            <p className="text-xs text-gray-500 mt-2">{primeCount} primes, {subCount} sous-traitants</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Certifies ARSP</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-4xl font-bold text-emerald-600">{registeredArspCount}</div>
            <p className="text-xs text-gray-500 mt-2">{globalComplianceScore}% du total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Documents expires</span>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-4xl font-bold text-red-600">{expiredDocs}</div>
            <p className="text-xs text-gray-500 mt-2">Sur {totalDocs} documents au total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Obligations en attente</span>
              <FileCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-4xl font-bold text-amber-600">{obligations.filter(o => !o.done).length}</div>
            <p className="text-xs text-gray-500 mt-2">{obligationProgress}% accompli au global</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "overview" as const, label: "Vue d'ensemble", icon: BarChart3 },
            { key: "enterprises" as const, label: "Entreprises", icon: Building2 },
            { key: "documents" as const, label: "Documents", icon: FileText },
            { key: "obligations" as const, label: "Obligations", icon: FileCheck },
            { key: "subcontractors" as const, label: "Sous-traitants", icon: Users },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Repartition par role</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Primes</span>
                      <span className="font-semibold text-blue-600">{primeCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${totalEnterprises > 0 ? (primeCount / totalEnterprises) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Sous-traitants</span>
                      <span className="font-semibold text-gray-600">{subCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-gray-500" style={{ width: `${totalEnterprises > 0 ? (subCount / totalEnterprises) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Enregistrement ARSP</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Certifies</span>
                      <span className="font-semibold text-emerald-600">{registeredArspCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${globalComplianceScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Non certifies</span>
                      <span className="font-semibold text-red-600">{totalEnterprises - registeredArspCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-red-500" style={{ width: `${totalEnterprises > 0 ? ((totalEnterprises - registeredArspCount) / totalEnterprises) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ENTERPRISES */}
        {activeTab === "enterprises" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Rechercher une entreprise..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">Tous les roles</option>
                <option value="prime">Primes</option>
                <option value="subcontractor">Sous-traitants</option>
              </select>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entreprise</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ARSP</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Capital</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Secteur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Province</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEnterprises.map(ent => {
                      const roleCfg = getRoleBadge(ent.role);
                      const RoleIcon = roleCfg.icon;
                      const arspSt = ent.arsp_registered ? computeStatus(ent.arsp_expiry) : "missing";
                      const aCfg = getStatusConfig(arspSt);
                      const AIcon = aCfg.icon;
                      return (
                        <tr key={ent.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 size={16} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{ent.name || "—"}</p>
                                <p className="text-xs text-gray-400">{ent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.bg} ${roleCfg.color}`}>
                              <RoleIcon size={12} /> {roleCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${aCfg.bg} ${aCfg.text} ${aCfg.border} border`}>
                              <AIcon size={12} /> {ent.arsp_registered ? aCfg.badge : "Non inscrit"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-sm font-semibold ${ent.congolese_capital >= 51 ? "text-emerald-600" : "text-red-600"}`}>
                              {ent.congolese_capital}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{ent.sector || "—"}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{ent.province || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredEnterprises.length === 0 && (
                <div className="text-center py-12">
                  <Search className="mx-auto text-gray-300 mb-3" size={32} />
                  <p className="text-gray-500 text-sm">Aucune entreprise trouvee</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DOCUMENTS (Admin) */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Document</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entreprise</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expiration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map(doc => {
                      const cfg = getStatusConfig(doc.status);
                      const StatusIcon = cfg.icon;
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{getDocTypeIcon(doc.type)}</span>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                                <p className="text-xs text-gray-400">{format(parseISO(doc.uploaded_at), "dd/MM/yyyy")}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{doc.enterprise_name || doc.enterprise_email}</td>
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{getDocTypeLabel(doc.type)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                              <StatusIcon size={12} /> {cfg.badge}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{getDaysRemaining(doc.expiry_date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: OBLIGATIONS (Admin) */}
        {activeTab === "obligations" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Titre</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entreprise</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categorie</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priorite</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Echeance</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {obligations.map(obl => {
                      const pcfg = getPriorityConfig(obl.priority);
                      const daysLeft = differenceInDays(parseISO(obl.deadline), new Date());
                      const isOverdue = daysLeft < 0;
                      return (
                        <tr key={obl.id} className={`hover:bg-gray-50/50 transition-colors ${obl.done ? "opacity-50" : ""}`}>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{obl.title}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{obl.enterprise_email}</td>
                          <td className="px-4 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{obl.category}</span></td>
                          <td className="px-4 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pcfg.bg} ${pcfg.color} ${pcfg.border} border`}>{pcfg.label}</span></td>
                          <td className={`px-4 py-4 text-sm ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {format(parseISO(obl.deadline), "dd/MM/yyyy")} {isOverdue && "(en retard)"}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${obl.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {obl.done ? "Accompli" : "En attente"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SUBCONTRACTORS (Admin) */}
        {activeTab === "subcontractors" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcontractors.map(sub => {
                const scfg = getSubStatusConfig(sub.status);
                const SubIcon = scfg.icon;
                const ratio = ((sub.contract_value / sub.total_contract_value) * 100).toFixed(1);
                return (
                  <div key={sub.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${scfg.bg} flex items-center justify-center`}>
                          <SubIcon size={20} className={scfg.color} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{sub.name}</h3>
                          <p className="text-xs text-gray-500">Prime: {sub.prime_name || sub.prime_email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${scfg.bg} ${scfg.color} ${scfg.border} border`}>{scfg.label}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Part du contrat</span>
                        <span className={`font-semibold ${parseFloat(ratio) > 40 ? "text-red-600" : "text-emerald-600"}`}>{ratio}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${parseFloat(ratio) > 40 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(parseFloat(ratio), 100)}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${sub.congolese_owned ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {sub.congolese_owned ? "Capital congolais" : "Capital etranger"}
                        </span>
                        <span className={`px-2 py-1 rounded ${sub.arsp_registered ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {sub.arsp_registered ? "ARSP OK" : "ARSP manquant"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {subcontractors.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">Aucun sous-traitant enregistre</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
    /* ═══════════════════════════════════════════════════════════════
     RENDER: PRIME & SUBCONTRACTOR SHARED VIEW
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord de conformite</h1>
          <p className="text-gray-500 mt-1">
            {isPrime ? "Suivez vos obligations legales, documents et sous-traitants" : "Suivez vos documents et obligations de conformite"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Actualiser
          </button>
          <button onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            <Upload size={18} /> Ajouter un document
          </button>
        </div>
      </div>

      {/* Urgent Alerts Banner */}
      {urgentAlerts.length > 0 && showAlerts && (
        <div className="space-y-2">
          {urgentAlerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${alert.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              {alert.type === "error" ? <AlertTriangle size={18} /> : <Bell size={18} />}
              <span className="text-sm font-medium flex-1">{alert.message}</span>
            </div>
          ))}
          <button onClick={() => setShowAlerts(false)} className="text-xs text-gray-400 hover:text-gray-600 underline">Masquer les alertes</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Score de conformite</span>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(complianceScore)}`}>{complianceScore}%</div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${getScoreBg(complianceScore)} transition-all duration-500`} style={{ width: `${complianceScore}%` }} />
            </div>
          </div>
          <p className={`text-xs mt-2 font-semibold ${getScoreColor(complianceScore)}`}>
            {getScoreLabel(complianceScore)} — {validDocs}/{totalDocs} documents valides
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Etat des documents</span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Valides</span>
              <span className="font-semibold text-emerald-600">{validDocs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500" /> A renouveler</span>
              <span className="font-semibold text-amber-600">{expiringDocs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5"><XCircle size={14} className="text-red-500" /> Expires</span>
              <span className="font-semibold text-red-600">{expiredDocs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5"><AlertOctagon size={14} className="text-gray-400" /> Non fournis</span>
              <span className="font-semibold text-gray-500">{missingDocs}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Obligations legales</span>
            <FileCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900">{doneObligations}/{totalObligations}</div>
          <div className="mt-3">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${obligationProgress}%` }} />
            </div>
          </div>
          <p className="text-xs mt-2 text-gray-500">{obligationProgress}% accompli</p>
          {nextDeadline && daysUntilNext !== null && (
            <p className={`text-xs mt-1 font-medium ${daysUntilNext < 0 ? "text-red-600" : daysUntilNext <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
              Prochaine: {daysUntilNext < 0 ? `${Math.abs(daysUntilNext)}j en retard` : `${daysUntilNext}j restants`}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">Certificat ARSP</span>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <ArspIcon size={20} className={arspConfig.iconColor} />
            <span className={`font-semibold ${arspConfig.text}`}>
              {enterprise?.arsp_registered ? arspConfig.badge : "Non inscrit"}
            </span>
          </div>
          {enterprise?.arsp_registered && enterprise.arsp_expiry && (
            <p className="text-xs text-gray-500">{getDaysRemaining(enterprise.arsp_expiry)}</p>
          )}
          {isPrime && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Sous-traitants conformes</span>
                <span className="font-semibold text-emerald-600">{compliantSubs}/{subcontractors.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div className={`h-1.5 rounded-full ${getScoreBg(subcontractorScore)} transition-all`} style={{ width: `${subcontractorScore}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {availableTabs.map(tab => {
          const tabConfig: Record<string, { label: string; icon: any; count?: number }> = {
            documents: { label: "Documents", icon: FileText },
            obligations: { label: "Obligations", icon: FileCheck, count: pendingObligations.length },
            subcontractors: { label: "Sous-traitants", icon: Users },
            profile: { label: "Profil", icon: Building2 },
            overview: { label: "Vue d'ensemble", icon: BarChart3 },
            enterprises: { label: "Entreprises", icon: Building2 },
          };
          const cfg = tabConfig[tab];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
              <Icon size={16} />
              {cfg.label}
              {cfg.count !== undefined && cfg.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>
                  {cfg.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Archive className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg font-medium">Aucun document enregistre</p>
              <p className="text-gray-400 text-sm mt-1">Telechargez vos documents de conformite pour commencer</p>
              <button onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                Ajouter un document
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiration</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map(doc => {
                      const cfg = getStatusConfig(doc.status);
                      const StatusIcon = cfg.icon;
                      const isExpanded = expandedDoc === doc.id;
                      return (
                        <>
                          <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getDocTypeIcon(doc.type)}</span>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                                  <p className="text-xs text-gray-400">Ajoute le {format(parseISO(doc.uploaded_at), "dd/MM/yyyy")}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{getDocTypeLabel(doc.type)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                                <StatusIcon size={12} /> {cfg.badge}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock size={14} className={cfg.iconColor} />
                                <span className={cfg.text}>{getDaysRemaining(doc.expiry_date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setExpandedDoc(isExpanded ? null : doc.id); }}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Voir details">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {doc.document_url && (
                                  <a href={doc.document_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Telecharger">
                                    <Download size={16} />
                                  </a>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id, doc.document_url); }}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 bg-gray-50/50">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                      <p className="text-xs text-gray-500 mb-1">Date d'ajout</p>
                                      <p className="text-sm font-medium text-gray-900">{format(parseISO(doc.uploaded_at), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                      <p className="text-xs text-gray-500 mb-1">Date d'expiration</p>
                                      <p className="text-sm font-medium text-gray-900">{doc.expiry_date ? format(parseISO(doc.expiry_date), "dd/MM/yyyy") : "Non definie"}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                                      <p className="text-xs text-gray-500 mb-1">Jours restants</p>
                                      <p className={`text-sm font-medium ${cfg.text}`}>{getDaysRemaining(doc.expiry_date)}</p>
                                    </div>
                                  </div>
                                  {doc.document_url && (
                                    <a href={doc.document_url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                      <Download size={16} /> Telecharger le document
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: OBLIGATIONS */}
      {activeTab === "obligations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Obligations legales et administratives</h2>
            <button onClick={() => setShowAddObligation(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Plus size={16} /> Ajouter une obligation
            </button>
          </div>
          {obligations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <FileCheck className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg font-medium">Aucune obligation enregistree</p>
              <p className="text-gray-400 text-sm mt-1">Ajoutez vos obligations legales pour suivre vos echeances</p>
            </div>
          ) : (
            <div className="space-y-3">
              {obligations.map(obl => {
                const pcfg = getPriorityConfig(obl.priority);
                const daysLeft = differenceInDays(parseISO(obl.deadline), new Date());
                const isOverdue = daysLeft < 0;
                const isUrgent = daysLeft >= 0 && daysLeft <= 7;
                return (
                  <div key={obl.id}
                    className={`bg-white rounded-xl border p-5 transition-all hover:shadow-sm ${obl.done ? "border-gray-100 opacity-60" : isOverdue ? "border-red-200 bg-red-50/30" : isUrgent ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleObligation(obl.id, obl.done)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${obl.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-blue-400"}`}>
                        {obl.done && <CheckCircle2 size={14} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm ${obl.done ? "line-through text-gray-400" : "text-gray-900"}`}>{obl.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pcfg.bg} ${pcfg.color} ${pcfg.border} border`}>{pcfg.label}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{obl.category}</span>
                        </div>
                        <p className={`text-sm mb-2 ${obl.done ? "text-gray-400" : "text-gray-600"}`}>{obl.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-600 font-medium" : isUrgent ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                            <Calendar size={12} />
                            {isOverdue ? `En retard de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}` : daysLeft === 0 ? "Echeance aujourd'hui" : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restants`}
                            — {format(parseISO(obl.deadline), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteObligation(obl.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: SUBCONTRACTORS (Prime only) */}
      {activeTab === "subcontractors" && isPrime && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sous-traitants et partenaires</h2>
              <p className="text-sm text-gray-500 mt-0.5">Verification de conformite ARSP et regle des 40%</p>
            </div>
            <button onClick={() => setShowAddSub(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Plus size={16} /> Ajouter un sous-traitant
            </button>
          </div>
          {subcontractors.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Regle des 40% — Sous-traitance</p>
                <p className="text-sm text-blue-700 mt-0.5">La loi ARSP interdit de sous-traiter plus de 40% de la valeur totale d'un contrat. Verifiez que vos sous-traitants respectent ce plafond.</p>
              </div>
            </div>
          )}
          {subcontractors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg font-medium">Aucun sous-traitant enregistre</p>
              <p className="text-gray-400 text-sm mt-1">Ajoutez vos sous-traitants pour verifier leur conformite</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subcontractors.map(sub => {
                const scfg = getSubStatusConfig(sub.status);
                const SubIcon = scfg.icon;
                const ratio = ((sub.contract_value / sub.total_contract_value) * 100).toFixed(1);
                return (
                  <div key={sub.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${scfg.bg} flex items-center justify-center`}>
                          <SubIcon size={20} className={scfg.color} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{sub.name}</h3>
                          <p className="text-xs text-gray-500">{sub.sector}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${scfg.bg} ${scfg.color} ${scfg.border} border`}>{scfg.label}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">Part du contrat</span>
                          <span className={`font-semibold ${parseFloat(ratio) > 40 ? "text-red-600" : parseFloat(ratio) > 30 ? "text-amber-600" : "text-emerald-600"}`}>{ratio}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${parseFloat(ratio) > 40 ? "bg-red-500" : parseFloat(ratio) > 30 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(parseFloat(ratio), 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{sub.contract_value.toLocaleString()} / {sub.total_contract_value.toLocaleString()} USD</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${sub.congolese_owned ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          <Building2 size={14} /> {sub.congolese_owned ? "Capital congolais >51%" : "Capital etranger"}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${sub.arsp_registered ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          <ShieldCheck size={14} /> {sub.arsp_registered ? "ARSP enregistre" : "ARSP non enregistre"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => handleDeleteSubcontractor(sub.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
            {/* TAB: PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Profil de l'entreprise</h2>
            <button onClick={() => {
              setEditProfile(enterprise || { name: "", congolese_capital: 51, arsp_registered: false, arsp_expiry: "", sector: "", province: "", rccm_number: "", id_nat: "", tax_id: "" });
              setShowEditProfile(true);
            }} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Plus size={16} /> {enterprise ? "Modifier" : "Creer le profil"}
            </button>
          </div>
          {!enterprise ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-lg font-medium">Profil non configure</p>
              <p className="text-gray-400 text-sm mt-1">Creez votre profil d'entreprise pour suivre votre conformite ARSP</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 size={28} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{enterprise.name || "Entreprise"}</h3>
                    <p className="text-sm text-gray-500">{enterprise.sector} — {enterprise.province}</p>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${enterprise.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {enterprise.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">RCCM</p>
                    <p className="text-sm font-semibold text-gray-900">{enterprise.rccm_number || "Non renseigne"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">ID Nat</p>
                    <p className="text-sm font-semibold text-gray-900">{enterprise.id_nat || "Non renseigne"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">ID Fiscal (NIF)</p>
                    <p className="text-sm font-semibold text-gray-900">{enterprise.tax_id || "Non renseigne"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{enterprise.email}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-500" /> Conformite ARSP
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Capital congolais</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{enterprise.congolese_capital}%</span>
                      <span className={`text-xs font-medium ${enterprise.congolese_capital >= 51 ? "text-emerald-600" : "text-red-600"}`}>
                        {enterprise.congolese_capital >= 51 ? "Conforme" : "Non conforme"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${enterprise.congolese_capital >= 51 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(enterprise.congolese_capital, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Minimum requis: 51%</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Certificat ARSP</p>
                    <div className="flex items-center gap-2">
                      <ArspIcon size={20} className={arspConfig.iconColor} />
                      <span className={`font-semibold text-sm ${arspConfig.text}`}>
                        {enterprise.arsp_registered ? arspConfig.badge : "Non inscrit"}
                      </span>
                    </div>
                    {enterprise.arsp_registered && enterprise.arsp_expiry && (
                      <p className="text-xs text-gray-500 mt-1">{getDaysRemaining(enterprise.arsp_expiry)}</p>
                    )}
                    {enterprise.arsp_certificate_url && (
                      <a href={enterprise.arsp_certificate_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                        <Download size={16} /> Certificat ARSP
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Telecharger un document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleUploadDocument} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de document <span className="text-red-500">*</span></label>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="RCCM">RCCM (Registre Commerce)</option>
                  <option value="FISCAL">Attestation Fiscale (DGI)</option>
                  <option value="CNSS">Attestation CNSS</option>
                  <option value="OHADA">Attestation OHADA</option>
                  <option value="ARSP">Certificat ARSP</option>
                  <option value="LICENCE">Licence Sectorielle</option>
                  <option value="TAX">Attestation Taxe</option>
                  <option value="OTHER">Autre Document</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'expiration</label>
                <input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">Laissez vide si le document n'expire pas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fichier (PDF, DOC, JPG) <span className="text-red-500">*</span></label>
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">{uploadFile ? uploadFile.name : "Cliquez pour selectionner un fichier"}</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)} className="hidden" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {uploading ? "Telechargement..." : "Telecharger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Obligation Modal */}
      {showAddObligation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle obligation</h2>
              <button onClick={() => setShowAddObligation(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddObligation} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre <span className="text-red-500">*</span></label>
                <input type="text" value={newObligation.title} onChange={e => setNewObligation({ ...newObligation, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Renouvellement ARSP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={newObligation.description} onChange={e => setNewObligation({ ...newObligation, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Details de l'obligation..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Categorie</label>
                  <select value={newObligation.category} onChange={e => setNewObligation({ ...newObligation, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="ARSP">ARSP</option>
                    <option value="TAX">Taxe</option>
                    <option value="CNSS">CNSS</option>
                    <option value="OHADA">OHADA</option>
                    <option value="LABOR">Travail</option>
                    <option value="REPORT">Rapport</option>
                    <option value="CUSTOM">Personnalise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priorite</label>
                  <select value={newObligation.priority} onChange={e => setNewObligation({ ...newObligation, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="high">Urgent</option>
                    <option value="medium">Important</option>
                    <option value="low">Normal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date limite <span className="text-red-500">*</span></label>
                <input type="date" value={newObligation.deadline} onChange={e => setNewObligation({ ...newObligation, deadline: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddObligation(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={addingObligation} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {addingObligation ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {addingObligation ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcontractor Modal (Prime only) */}
      {showAddSub && isPrime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un sous-traitant</h2>
              <button onClick={() => setShowAddSub(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSubcontractor} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du sous-traitant <span className="text-red-500">*</span></label>
                <input type="text" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur</label>
                <input type="text" value={newSub.sector} onChange={e => setNewSub({ ...newSub, sector: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Construction, Transport..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valeur sous-traitance (USD) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={newSub.contract_value} onChange={e => setNewSub({ ...newSub, contract_value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valeur totale contrat (USD) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" step="0.01" value={newSub.total_contract_value} onChange={e => setNewSub({ ...newSub, total_contract_value: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="200000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={newSub.congolese_owned} onChange={e => setNewSub({ ...newSub, congolese_owned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Capital congolais {'>'}51%</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={newSub.arsp_registered} onChange={e => setNewSub({ ...newSub, arsp_registered: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">ARSP enregistre</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddSub(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={addingSub} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {addingSub ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {addingSub ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{enterprise ? "Modifier le profil" : "Creer le profil"}</h2>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise</label>
                <input type="text" value={editProfile.name || ""} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nom de l'entreprise" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur</label>
                  <input type="text" value={editProfile.sector || ""} onChange={e => setEditProfile({ ...editProfile, sector: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Construction" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                  <input type="text" value={editProfile.province || ""} onChange={e => setEditProfile({ ...editProfile, province: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Kinshasa" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">RCCM</label>
                  <input type="text" value={editProfile.rccm_number || ""} onChange={e => setEditProfile({ ...editProfile, rccm_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Numero RCCM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Nat</label>
                  <input type="text" value={editProfile.id_nat || ""} onChange={e => setEditProfile({ ...editProfile, id_nat: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ID National" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Fiscal (NIF)</label>
                <input type="text" value={editProfile.tax_id || ""} onChange={e => setEditProfile({ ...editProfile, tax_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Numero d'identification fiscale" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Capital congolais (%)</label>
                <input type="number" min="0" max="100" value={editProfile.congolese_capital || ""}
                  onChange={e => setEditProfile({ ...editProfile, congolese_capital: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="51" />
                <p className="text-xs text-gray-400 mt-1">Minimum requis par la loi ARSP: 51%</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={editProfile.arsp_registered || false}
                    onChange={e => setEditProfile({ ...editProfile, arsp_registered: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">ARSP enregistre</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration ARSP</label>
                  <input type="date" value={editProfile.arsp_expiry || ""} onChange={e => setEditProfile({ ...editProfile, arsp_expiry: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditProfile(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {savingProfile ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceDashboard;