import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Plus, X, FileText, CheckCircle2, Clock, AlertTriangle, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/App";

const months = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

export function Declarations() {
  const auth = useAuth();
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [declarationLines, setDeclarationLines] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [newDeclaration, setNewDeclaration] = useState({ prime_name: "", month: months[new Date().getMonth()], year: new Date().getFullYear() });
  const [lines, setLines] = useState([{ subcontractor_name: "", activity_type: "", contract_ref: "", amount_htva: "" }]);

  useEffect(() => { fetchDeclarations(); checkOverdue(); }, []);

  function checkOverdue() {
    if (new Date().getDate() > 7) setIsOverdue(true);
  }

  async function fetchDeclarations() {
    setLoading(true);
    let query = supabase.from("declarations").select("*").order("created_at", { ascending: false });
    if (auth.userRole === "prime") query = query.eq("prime_email", auth.userEmail);
    const { data } = await query;
    if (data) setDeclarations(data);
    setLoading(false);
  }

  async function fetchDeclarationLines(declarationId) {
    const { data } = await supabase.from("declaration_lines").select("*").eq("declaration_id", declarationId);
    if (data) setDeclarationLines(data);
  }

  async function exportToExcel() {
    const { data: allDecl } = await supabase.from("declarations").select("*").order("created_at", { ascending: false });
    const { data: allLines } = await supabase.from("declaration_lines").select("*");
    if (!allDecl || !allLines) return;

    const rows = [];
    allDecl.forEach(d => {
      const lines = allLines.filter(l => l.declaration_id === d.id);
      if (lines.length === 0) {
        rows.push({
          "Entreprise": d.prime_name,
          "Email": d.prime_email,
          "Mois": d.month,
          "Annee": d.year,
          "Statut": d.status,
          "Sous-traitant": "",
          "Type activite": "",
          "Ref contrat": "",
          "Montant HTVA (USD)": "",
          "Montant ARSP (USD)": "",
          "Soumis le": d.submitted_at ? new Date(d.submitted_at).toLocaleDateString("fr-FR") : "",
        });
      } else {
        lines.forEach((l, i) => {
          rows.push({
            "Entreprise": i === 0 ? d.prime_name : "",
            "Email": i === 0 ? d.prime_email : "",
            "Mois": i === 0 ? d.month : "",
            "Annee": i === 0 ? d.year : "",
            "Statut": i === 0 ? d.status : "",
            "Sous-traitant": l.subcontractor_name,
            "Type activite": l.activity_type,
            "Ref contrat": l.contract_ref,
            "Montant HTVA (USD)": parseFloat(l.amount_htva).toFixed(2),
            "Montant ARSP (USD)": parseFloat(l.amount_arsp).toFixed(2),
            "Soumis le": i === 0 && d.submitted_at ? new Date(d.submitted_at).toLocaleDateString("fr-FR") : "",
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Declarations");
    XLSX.writeFile(wb, "declarations_arsp_" + new Date().toISOString().split("T")[0] + ".xlsx");
  }

  function addLine() { setLines([...lines, { subcontractor_name: "", activity_type: "", contract_ref: "", amount_htva: "" }]); }
  function removeLine(index) { setLines(lines.filter((_, i) => i !== index)); }
  function updateLine(index, field, value) { const updated = [...lines]; updated[index] = { ...updated[index], [field]: value }; setLines(updated); }
  function calculateTotal() { return lines.reduce((sum, line) => sum + (parseFloat(line.amount_htva) || 0), 0); }
  function calculateArsp() { return calculateTotal() * 0.012; }

  async function uploadProof(file, declarationId) {
    const fileName = Date.now() + "_proof_" + file.name;
    const { data: uploadData } = await supabase.storage.from("Documents").upload(fileName, file);
    if (uploadData) {
      const { data: urlData } = supabase.storage.from("Documents").getPublicUrl(fileName);
      const proofUrl = urlData.publicUrl;
      await supabase.from("declarations").update({ proof_of_payment_url: proofUrl }).eq("id", declarationId);
      setSelectedDeclaration(prev => ({ ...prev, proof_of_payment_url: proofUrl }));
      fetchDeclarations();
    }
  }

  async function handleSubmit(status) {
    setSubmitting(true);
    let proofUrl = "";
    if (proofFile) {
      const fileName = Date.now() + "_proof_" + proofFile.name;
      const { data: uploadData } = await supabase.storage.from("Documents").upload(fileName, proofFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("Documents").getPublicUrl(fileName);
        proofUrl = urlData.publicUrl;
      }
    }
    const { data: decData, error } = await supabase.from("declarations").insert([{
      prime_email: auth.userEmail,
      prime_name: newDeclaration.prime_name,
      month: newDeclaration.month,
      year: newDeclaration.year,
      status: status,
      proof_of_payment_url: proofUrl,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
    }]).select();
    if (!error && decData && decData[0]) {
      const decId = decData[0].id;
      const lineInserts = lines.filter(l => l.subcontractor_name && l.amount_htva).map(l => ({
        declaration_id: decId,
        subcontractor_name: l.subcontractor_name,
        activity_type: l.activity_type,
        contract_ref: l.contract_ref,
        amount_htva: parseFloat(l.amount_htva),
      }));
      await supabase.from("declaration_lines").insert(lineInserts);
      setShowNew(false);
      setLines([{ subcontractor_name: "", activity_type: "", contract_ref: "", amount_htva: "" }]);
      setNewDeclaration({ prime_name: "", month: months[new Date().getMonth()], year: new Date().getFullYear() });
      setProofFile(null);
      fetchDeclarations();
    }
    setSubmitting(false);
  }

  async function handleAdminAction(id, status, reason) {
    await supabase.from("declarations").update({ status, rejection_reason: reason || null }).eq("id", id);
    setSelectedDeclaration(null);
    fetchDeclarations();
  }

  const statusConfig = {
    draft: { label: "Brouillon", color: "bg-gray-100 text-gray-600", icon: FileText },
    submitted: { label: "Soumise", color: "bg-blue-100 text-blue-700", icon: Clock },
    validated: { label: "Validee", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    rejected: { label: "Rejetee", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const hasCurrentDeclaration = declarations.some(d => d.month === currentMonth && d.year === currentYear);

  const filteredDeclarations = declarations.filter(d => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesSearch = !searchQuery || d.prime_name.toLowerCase().includes(searchQuery.toLowerCase()) || d.prime_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">{auth.userRole === "admin" ? "Declarations des Entreprises" : "Mes Declarations Mensuelles"}</h2>
          <p className="text-sm text-gray-500 mt-1">Declaration mensuelle de sous-traitance ARSP</p>
        </div>
        <div className="flex gap-2">
          {auth.userRole === "admin" && (
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Exporter Excel
            </button>
          )}
          {auth.userRole === "prime" && (
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]">
              <Plus className="w-4 h-4" />Nouvelle declaration
            </button>
          )}
        </div>
      </div>

      {auth.userRole === "admin" && (
        <div className="bg-white rounded-xl p-4 card-shadow mb-4 space-y-3">
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Toutes" },
              { key: "submitted", label: "Soumises" },
              { key: "validated", label: "Validees" },
              { key: "rejected", label: "Rejetees" },
              { key: "draft", label: "Brouillons" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (statusFilter === f.key ? "bg-[#0a2540] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className="ml-1 opacity-70">({declarations.filter(d => d.status === f.key).length})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {auth.userRole === "prime" && isOverdue && !hasCurrentDeclaration && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Declaration en retard!</p>
            <p className="text-xs text-red-600">Vous navez pas soumis votre declaration pour {currentMonth} {currentYear}. Date limite: le 7 du mois.</p>
          </div>
          <button onClick={() => setShowNew(true)} className="ml-auto px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 shrink-0">Soumettre maintenant</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : declarations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl card-shadow">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune declaration</p>
          {auth.userRole === "prime" && <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-[#007FFF] hover:underline">Creer votre premiere declaration</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeclarations.map((d) => {
            const status = statusConfig[d.status] || statusConfig.draft;
            const Icon = status.icon;
            return (
              <div key={d.id} onClick={() => { setSelectedDeclaration(d); fetchDeclarationLines(d.id); }} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-[#0a2540]">{d.month} {d.year}</h3>
                        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase " + status.color}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gray-500">{d.prime_name}</p>
                      {auth.userRole === "admin" && <p className="text-xs text-gray-400">{d.prime_email}</p>}
                    </div>
                  </div>
                  <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0a2540]">Nouvelle declaration mensuelle</h3>
                <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Nom de lentreprise principale</label>
                    <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" placeholder="Nom..." value={newDeclaration.prime_name} onChange={(e) => setNewDeclaration({...newDeclaration, prime_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Mois</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newDeclaration.month} onChange={(e) => setNewDeclaration({...newDeclaration, month: e.target.value})}>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Annee</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]" value={newDeclaration.year} onChange={(e) => setNewDeclaration({...newDeclaration, year: parseInt(e.target.value)})}>
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Sous-traitants</label>
                    <button onClick={addLine} className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline"><Plus className="w-3 h-3" />Ajouter</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F6F9FC]">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sous-traitant</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Activite</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Ref contrat</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">HTVA (USD)</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">ARSP 1.2%</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {lines.map((line, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2"><input className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="Nom..." value={line.subcontractor_name} onChange={(e) => updateLine(i, "subcontractor_name", e.target.value)} /></td>
                            <td className="px-3 py-2"><input className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="Activite..." value={line.activity_type} onChange={(e) => updateLine(i, "activity_type", e.target.value)} /></td>
                            <td className="px-3 py-2"><input className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="REF-001" value={line.contract_ref} onChange={(e) => updateLine(i, "contract_ref", e.target.value)} /></td>
                            <td className="px-3 py-2"><input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="0.00" value={line.amount_htva} onChange={(e) => updateLine(i, "amount_htva", e.target.value)} /></td>
                            <td className="px-3 py-2 text-xs font-medium text-[#0a2540]">${((parseFloat(line.amount_htva) || 0) * 0.012).toFixed(2)}</td>
                            <td className="px-3 py-2">{lines.length > 1 && <button onClick={() => removeLine(i)}><Trash2 className="w-4 h-4 text-red-400" /></button>}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#F6F9FC]">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-xs font-bold text-right text-[#0a2540]">Total:</td>
                          <td className="px-3 py-2 text-xs font-bold text-[#0a2540]">${calculateTotal().toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-red-600">${calculateArsp().toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Preuve de paiement</label>
                  <div className={"border-2 border-dashed rounded-xl p-4 text-center " + (proofFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-[#007FFF]")}>
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="proof-upload" onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)} />
                    <label htmlFor="proof-upload" className="cursor-pointer text-xs text-[#007FFF] hover:underline">{proofFile ? proofFile.name : "Cliquer pour uploader"}</label>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Montant du a lARSP</p>
                  <p className="text-2xl font-bold text-amber-700">${calculateArsp().toFixed(2)} USD</p>
                  <p className="text-xs text-amber-600 mt-1">1.2% du total HTVA de ${calculateTotal().toFixed(2)} USD</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleSubmit("draft")} disabled={submitting} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50">Enregistrer brouillon</button>
                  <button onClick={() => handleSubmit("submitted")} disabled={submitting || !newDeclaration.prime_name} className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] disabled:opacity-50">{submitting ? "Envoi..." : "Soumettre la declaration"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDeclaration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDeclaration(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0a2540]">Declaration {selectedDeclaration.month} {selectedDeclaration.year}</h3>
                  <p className="text-sm text-gray-500">{selectedDeclaration.prime_name}</p>
                </div>
                <button onClick={() => setSelectedDeclaration(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <span className={"px-2 py-0.5 rounded-full text-xs font-bold uppercase " + (statusConfig[selectedDeclaration.status] ? statusConfig[selectedDeclaration.status].color : "")}>
                  {statusConfig[selectedDeclaration.status] ? statusConfig[selectedDeclaration.status].label : ""}
                </span>
                {declarationLines.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F6F9FC]">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Sous-traitant</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Activite</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Ref</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">HTVA (USD)</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">ARSP (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {declarationLines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-2 text-xs">{line.subcontractor_name}</td>
                            <td className="px-3 py-2 text-xs">{line.activity_type}</td>
                            <td className="px-3 py-2 text-xs">{line.contract_ref}</td>
                            <td className="px-3 py-2 text-xs">${parseFloat(line.amount_htva).toFixed(2)}</td>
                            <td className="px-3 py-2 text-xs font-medium text-red-600">${parseFloat(line.amount_arsp).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#F6F9FC]">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-xs font-bold text-right text-[#0a2540]">Total:</td>
                          <td className="px-3 py-2 text-xs font-bold text-[#0a2540]">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_htva), 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-red-600">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_arsp), 0).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {selectedDeclaration.proof_of_payment_url ? (
                  <a href={selectedDeclaration.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                    <FileText className="w-4 h-4" />Voir la preuve de paiement
                  </a>
                ) : auth.userRole === "prime" && selectedDeclaration.status !== "validated" ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ajouter preuve de paiement</label>
                    <div className="border-2 border-dashed rounded-xl p-4 text-center border-gray-300 hover:border-[#007FFF]">
                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="proof-upload-detail"
                        onChange={async (e) => {
                          const file = e.target.files ? e.target.files[0] : null;
                          if (file) await uploadProof(file, selectedDeclaration.id);
                        }}
                      />
                      <label htmlFor="proof-upload-detail" className="cursor-pointer text-xs text-[#007FFF] hover:underline">Cliquer pour uploader la preuve</label>
                    </div>
                  </div>
                ) : null}

                {selectedDeclaration.rejection_reason && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-700">Motif du rejet:</p>
                    <p className="text-sm text-red-600">{selectedDeclaration.rejection_reason}</p>
                  </div>
                )}

                {auth.userRole === "admin" && selectedDeclaration.status === "submitted" && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleAdminAction(selectedDeclaration.id, "validated", undefined)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />Valider
                    </button>
                    <button onClick={() => { const reason = prompt("Motif du rejet:"); if (reason) handleAdminAction(selectedDeclaration.id, "rejected", reason); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" />Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
