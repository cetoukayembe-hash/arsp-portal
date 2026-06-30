import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck, Search, Download, Clock, User,
  FileText, Building2, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function getActionConfig(action: string) {
  switch (action) {
    case "CREATE": return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, label: "Creation" };
    case "UPDATE": return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: FileText, label: "Modification" };
    case "DELETE": return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle, label: "Suppression" };
    case "LOGIN": return { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: User, label: "Connexion" };
    case "LOGOUT": return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: User, label: "Deconnexion" };
    case "UPLOAD": return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: FileText, label: "Upload" };
    case "APPROVE": return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, label: "Approbation" };
    case "REJECT": return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle, label: "Rejet" };
    default: return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: FileText, label: action };
  }
}

function getTableIcon(table: string | null) {
  switch (table) {
    case "enterprises": return Building2;
    case "compliance_documents": return FileText;
    case "users": return User;
    default: return FileText;
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterAction !== "all") query = query.eq("action", filterAction);
      if (filterTable !== "all") query = query.eq("target_table", filterTable);
      if (dateFrom) query = query.gte("created_at", dateFrom + "T00:00:00");
      if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

      const { data, error } = await query.limit(500);
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      (log.target_table && log.target_table.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.target_id && log.target_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  function exportToCSV() {
    const headers = ["Date", "Action", "Table", "Target ID", "Utilisateur", "Success", "Details"];
    const rows = filteredLogs.map(log => [
      format(parseISO(log.created_at), "dd/MM/yyyy HH:mm"),
      log.action,
      log.target_table || "",
      log.target_id || "",
      log.user_email || "",
      log.success ? "Oui" : "Non",
      JSON.stringify(log.details)
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-gray-500">Chargement des logs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Journal d'audit
          </h1>
          <p className="text-gray-500 mt-1">Tracabilite complete des actions — point anti-corruption</p>
        </div>
        <button onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors">
          <Download size={16} /> Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Rechercher par email, table ou ID..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); fetchLogs(); }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">Toutes les actions</option>
            <option value="CREATE">Creation</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
            <option value="LOGIN">Connexion</option>
            <option value="LOGOUT">Deconnexion</option>
            <option value="UPLOAD">Upload</option>
            <option value="APPROVE">Approbation</option>
            <option value="REJECT">Rejet</option>
          </select>
          <select value={filterTable} onChange={e => { setFilterTable(e.target.value); fetchLogs(); }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">Toutes les tables</option>
            <option value="enterprises">Entreprises</option>
            <option value="compliance_documents">Documents</option>
            <option value="compliance_obligations">Obligations</option>
            <option value="subcontractor_checks">Sous-traitants</option>
            <option value="tenders">Appels d'offres</option>
            <option value="users">Utilisateurs</option>
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            <span className="text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            <button onClick={fetchLogs}
              className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total actions", value: logs.length, color: "text-blue-600" },
          { label: "Creations", value: logs.filter(l => l.action === "CREATE").length, color: "text-emerald-600" },
          { label: "Modifications", value: logs.filter(l => l.action === "UPDATE").length, color: "text-blue-600" },
          { label: "Suppressions", value: logs.filter(l => l.action === "DELETE").length, color: "text-red-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Table</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Target ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Success</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map(log => {
                const acfg = getActionConfig(log.action);
                const ActionIcon = acfg.icon;
                const TableIcon = getTableIcon(log.target_table);
                const isExpanded = expandedLog === log.id;

                return (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${acfg.bg} ${acfg.color} ${acfg.border} border`}>
                          <ActionIcon size={12} /> {acfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <TableIcon size={14} className="text-gray-400" />
                          {log.target_table || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{log.target_id ? log.target_id.slice(0, 8) + "..." : "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.user_email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.success ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          {log.success ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </td>
                    </tr>
                    {isExpanded && log.details && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50/50">
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium uppercase">Details</p>
                            <pre className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
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
        {filteredLogs.length === 0 && (
          <div className="text-center py-16">
            <ShieldCheck className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Aucun log trouve</p>
            <p className="text-gray-400 text-sm mt-1">Les actions enregistrees apparaitront ici</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;