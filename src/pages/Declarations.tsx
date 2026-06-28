import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Plus, X, FileText, CheckCircle2, Clock, AlertTriangle, Trash2, Upload, Link2, Eye, Pencil, Trash, BarChart3, TrendingUp, PieChart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/App";

const months = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];

interface ContractOption {
  id: string;
  title: string;
  reference: string;
  subcontractor_name: string;
  subcontractor_email: string;
  value: number;
  document_type: string;
  status: string;
}

export function Declarations() {
  const auth = useAuth();
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [declarationLines, setDeclarationLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [primeDetails, setPrimeDetails] = useState({ name: "", email: "" });
  const [editingDeclarationId, setEditingDeclarationId] = useState(null);

  const [newDeclaration, setNewDeclaration] = useState({ 
    prime_name: "", 
    month: months[new Date().getMonth()], 
    year: new Date().getFullYear() 
  });

  const [lines, setLines] = useState([{ 
    subcontractor_name: "", 
    activity_type: "", 
    contract_ref: "", 
    amount_htva: "", 
    contract_id: null,
    document_type: 'manual',
    amount_paid: "",
    manualEntry: true,
  }]);

  const [primeContracts, setPrimeContracts] = useState<ContractOption[]>([]);
  const [contractDetails, setContractDetails] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [cumulativeArsp, setCumulativeArsp] = useState([]);
  const [showCumulative, setShowCumulative] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => { 
    fetchDeclarations(); 
    checkOverdue(); 
    fetchPrimeDetails();
    fetchPrimeContracts();
  }, []);

  function checkOverdue() {
    if (new Date().getDate() > 7) setIsOverdue(true);
  }

  async function fetchPrimeDetails() {
    if (!auth.userId) return;
    const { data, error } = await supabase
      .from('enterprises')
      .select('name, email')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching prime details:', error);
    }

    if (data) {
      setPrimeDetails({ name: data.name, email: data.email });
      setNewDeclaration(prev => ({ ...prev, prime_name: data.name }));
    }
  }

  async function fetchPrimeContracts() {
    if (!auth.userId) return;
    const { data } = await supabase
      .from('contracts')
      .select('id, title, reference, subcontractor_name, subcontractor_email, value, document_type, status')
      .eq('prime_id', auth.userId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });
    if (data) setPrimeContracts(data);
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
    console.log('Fetching lines for declaration:', declarationId);
    setLinesLoading(true);
    setDeclarationLines([]);
    const { data, error } = await supabase
      .from("declaration_lines")
      .select("*")
      .eq("declaration_id", declarationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error('Error fetching lines:', error);
    } else {
      console.log('Lines fetched:', data?.length || 0, data);
    }

    if (data) setDeclarationLines(data);
    setLinesLoading(false);
  }

  async function fetchContractDetails(contractId) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching contract:', error);
      return;
    }

    if (data) {
      setContractDetails(data);
      setShowContractModal(true);
    }
  }

  async function fetchCumulativeArsp() {
    const { data, error } = await supabase
      .from("declarations")
      .select('id, prime_name, prime_email, status');

    if (error || !data) {
      console.error('Error fetching declarations for cumulative:', error);
      return;
    }

    const declarationIds = data.map(d => d.id);

    const { data: linesData, error: linesError } = await supabase
      .from("declaration_lines")
      .select('declaration_id, amount_arsp')
      .in('declaration_id', declarationIds);

    if (linesError || !linesData) {
      console.error('Error fetching lines for cumulative:', linesError);
      return;
    }

    const primeMap = {};
    data.forEach(d => {
      if (!primeMap[d.prime_email]) {
        primeMap[d.prime_email] = {
          prime_name: d.prime_name,
          prime_email: d.prime_email,
          total_arsp: 0,
          declaration_count: 0,
          validated_count: 0,
        };
      }
      primeMap[d.prime_email].declaration_count += 1;
      if (d.status === 'validated') {
        primeMap[d.prime_email].validated_count += 1;
      }
    });

    linesData.forEach(line => {
      const decl = data.find(d => d.id === line.declaration_id);
      if (decl && primeMap[decl.prime_email]) {
        primeMap[decl.prime_email].total_arsp += parseFloat(line.amount_arsp) || 0;
      }
    });

    const result = Object.values(primeMap).sort((a, b) => b.total_arsp - a.total_arsp);
    setCumulativeArsp(result);
    setShowCumulative(true);
  }

  async function fetchReportData() {
    const { data: allDecl, error: declError } = await supabase
      .from("declarations")
      .select("id, month, year, status, created_at");

    if (declError || !allDecl) {
      console.error('Error fetching report declarations:', declError);
      return;
    }

    const declarationIds = allDecl.map(d => d.id);

    const { data: allLines, error: linesError } = await supabase
      .from("declaration_lines")
      .select("declaration_id, amount_arsp, amount_htva, amount_paid");

    if (linesError || !allLines) {
      console.error('Error fetching report lines:', linesError);
      return;
    }

    const monthlyMap = {};
    allDecl.forEach(d => {
      const key = `${d.month} ${d.year}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: d.month, year: d.year, count: 0, arsp: 0, htva: 0, paid: 0 };
      }
      monthlyMap[key].count += 1;
    });

    allLines.forEach(line => {
      const decl = allDecl.find(d => d.id === line.declaration_id);
      if (decl) {
        const key = `${decl.month} ${decl.year}`;
        if (monthlyMap[key]) {
          monthlyMap[key].arsp += parseFloat(line.amount_arsp) || 0;
          monthlyMap[key].htva += parseFloat(line.amount_htva) || 0;
          monthlyMap[key].paid += parseFloat(line.amount_paid || line.amount_htva) || 0;
        }
      }
    });

    const monthly = Object.values(monthlyMap).sort((a, b) => {
      const monthIdxA = months.indexOf(a.month);
      const monthIdxB = months.indexOf(b.month);
      if (a.year !== b.year) return a.year - b.year;
      return monthIdxA - monthIdxB;
    });

    const statusDist = { draft: 0, submitted: 0, validated: 0, rejected: 0 };
    allDecl.forEach(d => {
      if (statusDist[d.status] !== undefined) statusDist[d.status] += 1;
    });

    const yearlyMap = {};
    allDecl.forEach(d => {
      if (!yearlyMap[d.year]) yearlyMap[d.year] = { year: d.year, count: 0, arsp: 0 };
      yearlyMap[d.year].count += 1;
    });
    allLines.forEach(line => {
      const decl = allDecl.find(d => d.id === line.declaration_id);
      if (decl && yearlyMap[decl.year]) {
        yearlyMap[decl.year].arsp += parseFloat(line.amount_arsp) || 0;
      }
    });
    const yearly = Object.values(yearlyMap).sort((a, b) => a.year - b.year);

    setReportData({ monthly, statusDist, yearly, totalDeclarations: allDecl.length, totalArsp: allLines.reduce((s, l) => s + parseFloat(l.amount_arsp), 0) });
    setShowReports(true);
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
          "Type document": "",
          "Ref contrat": "",
          "Valeur contrat (USD)": "",
          "Montant paye (USD)": "",
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
            "Type document": l.document_type === 'contract' ? 'Contrat' : l.document_type === 'purchase_order' ? 'Bon de Commande' : 'Manuel',
            "Ref contrat": l.contract_ref,
            "Valeur contrat (USD)": parseFloat(l.amount_htva).toFixed(2),
            "Montant paye (USD)": parseFloat(l.amount_paid || l.amount_htva).toFixed(2),
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

  function addLine() { 
    setLines([...lines, { 
      subcontractor_name: "", 
      activity_type: "", 
      contract_ref: "", 
      amount_htva: "", 
      contract_id: null,
      document_type: 'manual',
      amount_paid: "",
      manualEntry: true,
    }]); 
  }

  function removeLine(index) { setLines(lines.filter((_, i) => i !== index)); }

  function updateLine(index, field, value) { 
    const updated = [...lines]; 
    updated[index] = { ...updated[index], [field]: value }; 
    setLines(updated); 
  }

  function selectContractForLine(index, contractId: string) {
    const contract = primeContracts.find(c => c.id === contractId);
    if (!contract) return;

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      contract_id: contract.id,
      subcontractor_name: contract.subcontractor_name || contract.subcontractor_email,
      contract_ref: contract.reference,
      amount_htva: contract.value.toString(),
      amount_paid: contract.value.toString(),
      document_type: contract.document_type,
      manualEntry: false,
    };
    setLines(updated);
  }

  function toggleManualEntry(index) {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      manualEntry: true,
      contract_id: null,
      document_type: 'manual',
      subcontractor_name: "",
      contract_ref: "",
      amount_htva: "",
      amount_paid: "",
    };
    setLines(updated);
  }

  function calculateTotalHtva() { 
    return lines.reduce((sum, line) => sum + (parseFloat(line.amount_htva) || 0), 0); 
  }

  function calculateTotalPaid() { 
    return lines.reduce((sum, line) => sum + (parseFloat(line.amount_paid) || parseFloat(line.amount_htva) || 0), 0); 
  }

  function calculateArsp() { 
    return calculateTotalPaid() * 0.012; 
  }

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

    let decData, error;

    if (editingDeclarationId) {
      const { data, error: updateError } = await supabase.from("declarations").update({
        prime_email: auth.userEmail,
        prime_name: newDeclaration.prime_name || primeDetails.name,
        month: newDeclaration.month,
        year: newDeclaration.year,
        status: status,
        proof_of_payment_url: proofUrl || undefined,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
      }).eq("id", editingDeclarationId).select();

      decData = data;
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase.from("declarations").insert([{
        prime_email: auth.userEmail,
        prime_name: newDeclaration.prime_name || primeDetails.name,
        month: newDeclaration.month,
        year: newDeclaration.year,
        status: status,
        proof_of_payment_url: proofUrl,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
      }]).select();

      decData = data;
      error = insertError;
    }

    if (!error && decData && decData[0]) {
      const decId = decData[0].id;
      const lineInserts = lines.filter(l => l.subcontractor_name && l.amount_htva).map(l => ({
        declaration_id: decId,
        subcontractor_name: l.subcontractor_name,
        activity_type: l.activity_type || (l.document_type === 'contract' ? 'Contrat' : l.document_type === 'purchase_order' ? 'Bon de Commande' : 'Prestation'),
        contract_ref: l.contract_ref,
        amount_htva: parseFloat(l.amount_htva),
        amount_paid: parseFloat(l.amount_paid) || parseFloat(l.amount_htva),
        contract_id: l.contract_id,
        document_type: l.document_type,
      }));

      if (editingDeclarationId) {
        await supabase.from("declaration_lines").delete().eq("declaration_id", decId);
      }

      const { error: lineError } = await supabase.from("declaration_lines").insert(lineInserts);
      if (lineError) {
        console.error("Lines insert error:", lineError);
        alert("Erreur lors de l'enregistrement des lignes: " + lineError.message);
      }

      setShowNew(false);
      setEditingDeclarationId(null);
      setLines([{ 
        subcontractor_name: "", 
        activity_type: "", 
        contract_ref: "", 
        amount_htva: "", 
        contract_id: null,
        document_type: 'manual',
        amount_paid: "",
        manualEntry: true,
      }]);
      setNewDeclaration({ 
        prime_name: primeDetails.name, 
        month: months[new Date().getMonth()], 
        year: new Date().getFullYear() 
      });
      setProofFile(null);
      fetchDeclarations();
    }
    setSubmitting(false);
  }

  async function handleDeleteDeclaration(declarationId) {
    if (!confirm("Etes-vous sur de vouloir supprimer cette declaration ? Cette action est irreversible.")) return;

    setSubmitting(true);
    await supabase.from("declaration_lines").delete().eq("declaration_id", declarationId);
    const { error } = await supabase.from("declarations").delete().eq("id", declarationId);

    if (error) {
      console.error("Delete error:", error);
      alert("Erreur lors de la suppression: " + error.message);
    } else {
      fetchDeclarations();
    }

    setSubmitting(false);
  }

  async function handleEditDeclaration(declaration) {
    setEditingDeclarationId(declaration.id);
    setNewDeclaration({
      prime_name: declaration.prime_name,
      month: declaration.month,
      year: declaration.year,
    });

    const { data: existingLines } = await supabase
      .from("declaration_lines")
      .select("*")
      .eq("declaration_id", declaration.id)
      .order("created_at", { ascending: true });

    if (existingLines && existingLines.length > 0) {
      setLines(existingLines.map(l => ({
        subcontractor_name: l.subcontractor_name || "",
        activity_type: l.activity_type || "",
        contract_ref: l.contract_ref || "",
        amount_htva: l.amount_htva?.toString() || "",
        contract_id: l.contract_id,
        document_type: l.document_type || 'manual',
        amount_paid: l.amount_paid?.toString() || l.amount_htva?.toString() || "",
        manualEntry: !l.contract_id,
      })));
    } else {
      setLines([{ 
        subcontractor_name: "", 
        activity_type: "", 
        contract_ref: "", 
        amount_htva: "", 
        contract_id: null,
        document_type: 'manual',
        amount_paid: "",
        manualEntry: true,
      }]);
    }

    setShowNew(true);
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

  const docTypeConfig = {
    contract: { label: 'Contrat', color: 'bg-[#1a237e] text-white' },
    purchase_order: { label: 'Bon de Commande', color: 'bg-[#FFCD00] text-[#1a237e]' },
    manual: { label: 'Manuel', color: 'bg-gray-200 text-gray-600' },
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

  const getMax = (arr, key) => Math.max(...arr.map(d => d[key] || 0), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0a2540]">{auth.userRole === "admin" ? "Declarations des Entreprises" : "Mes Declarations Mensuelles"}</h2>
          <p className="text-sm text-gray-500 mt-1">Declaration mensuelle de sous-traitance ARSP (1.2% du montant paye)</p>
        </div>
        <div className="flex gap-2">
          {auth.userRole === "admin" && (
            <>
              <button onClick={fetchReportData} className="flex items-center gap-2 px-4 py-2 bg-[#007FFF] text-white rounded-lg text-sm font-medium hover:bg-[#0066CC]">
                <TrendingUp className="w-4 h-4" />Rapports
              </button>
              <button onClick={fetchCumulativeArsp} className="flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-lg text-sm font-medium hover:bg-[#0d1b5e]">
                <BarChart3 className="w-4 h-4" />ARSP cumule
              </button>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Exporter Excel
              </button>
            </>
          )}
          {auth.userRole === "prime" && (
            <button onClick={() => { setEditingDeclarationId(null); setShowNew(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]">
              <Plus className="w-4 h-4" />Nouvelle declaration
            </button>
          )}
        </div>
      </div>

      {/* CUMULATIVE ARSP SECTION */}
      {auth.userRole === "admin" && showCumulative && (
        <div className="bg-white rounded-xl p-5 card-shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0a2540] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1a237e]" />
              ARSP cumule par entreprise
            </h3>
            <button onClick={() => setShowCumulative(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {cumulativeArsp.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucune donnee disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a2540] text-white">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Entreprise</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Email</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold">Declarations</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold">Validees</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold">ARSP total (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cumulativeArsp.map((prime, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-[#0a2540]">{prime.prime_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{prime.prime_email}</td>
                      <td className="px-4 py-3 text-xs text-center font-medium">{prime.declaration_count}</td>
                      <td className="px-4 py-3 text-xs text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{prime.validated_count}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">${prime.total_arsp.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F6F9FC]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs font-bold text-right text-[#0a2540]">Total general:</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-amber-600">${cumulativeArsp.reduce((s, p) => s + p.total_arsp, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORTS MODAL */}
      {showReports && reportData && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowReports(false)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0a2540] flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#007FFF]" />
                  Tableau de bord ARSP
                </h3>
                <button onClick={() => setShowReports(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0a2540] rounded-xl p-4 text-white text-center">
                  <p className="text-xs text-gray-300 mb-1">Total declarations</p>
                  <p className="text-3xl font-bold">{reportData.totalDeclarations}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">ARSP total collecte</p>
                  <p className="text-2xl font-bold text-emerald-700">${reportData.totalArsp.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1">Declarations validees</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.statusDist.validated}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                  <p className="text-xs text-amber-600 mb-1">En attente</p>
                  <p className="text-2xl font-bold text-amber-700">{reportData.statusDist.submitted}</p>
                </div>
              </div>

              {/* Monthly ARSP Bar Chart */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  ARSP collecte par mois
                </h4>
                <div className="bg-[#F6F9FC] rounded-xl p-4">
                  {reportData.monthly.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune donnee</p>
                  ) : (
                    <div className="space-y-3">
                      {reportData.monthly.map((m, i) => {
                        const maxArsp = getMax(reportData.monthly, 'arsp');
                        const pct = (m.arsp / maxArsp) * 100;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-24 text-xs font-medium text-gray-600 shrink-0">{m.month} {m.year}</div>
                            <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              >
                                {pct > 20 && <span className="text-[10px] text-white font-bold">${m.arsp.toFixed(0)}</span>}
                              </div>
                            </div>
                            {pct <= 20 && <span className="text-xs text-gray-500 w-16 text-right">${m.arsp.toFixed(0)}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Declarations Count Chart */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Nombre de declarations par mois
                </h4>
                <div className="bg-[#F6F9FC] rounded-xl p-4">
                  {reportData.monthly.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune donnee</p>
                  ) : (
                    <div className="space-y-3">
                      {reportData.monthly.map((m, i) => {
                        const maxCount = getMax(reportData.monthly, 'count');
                        const pct = (m.count / maxCount) * 100;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-24 text-xs font-medium text-gray-600 shrink-0">{m.month} {m.year}</div>
                            <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full bg-[#007FFF] rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              >
                                {pct > 20 && <span className="text-[10px] text-white font-bold">{m.count}</span>}
                              </div>
                            </div>
                            {pct <= 20 && <span className="text-xs text-gray-500 w-16 text-right">{m.count}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Repartition par statut
                </h4>
                <div className="bg-[#F6F9FC] rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'draft', label: 'Brouillons', color: 'bg-gray-400', textColor: 'text-gray-600' },
                      { key: 'submitted', label: 'Soumises', color: 'bg-blue-500', textColor: 'text-blue-600' },
                      { key: 'validated', label: 'Validees', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                      { key: 'rejected', label: 'Rejetees', color: 'bg-red-500', textColor: 'text-red-600' },
                    ].map((s) => {
                      const count = reportData.statusDist[s.key];
                      const total = reportData.totalDeclarations || 1;
                      const pct = ((count / total) * 100).toFixed(1);
                      return (
                        <div key={s.key} className="bg-white rounded-lg p-3 text-center">
                          <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2`}></div>
                          <p className="text-2xl font-bold text-[#0a2540]">{count}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                          <p className={`text-xs font-medium ${s.textColor}`}>{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Yearly Summary Table */}
              <div>
                <h4 className="text-sm font-bold text-[#0a2540] mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recapitulatif annuel
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a2540] text-white">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold">Annee</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold">Declarations</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold">ARSP collecte (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.yearly.map((y, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-[#0a2540]">{y.year}</td>
                          <td className="px-4 py-3 text-xs text-center">{y.count}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">${y.arsp.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            const isDraft = d.status === 'draft';
            const isPrimeOwner = auth.userRole === 'prime' && d.prime_email === auth.userEmail;
            return (
              <div key={d.id} className="bg-white rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer group">
                <div className="flex items-center justify-between gap-4">
                  <div 
                    className="flex items-center gap-4 flex-1"
                    onClick={() => { setSelectedDeclaration(d); fetchDeclarationLines(d.id); }}
                  >
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
                  <div className="flex items-center gap-2">
                    {isDraft && isPrimeOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditDeclaration(d); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteDeclaration(d.id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW / EDIT DECLARATION MODAL */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowNew(false); setEditingDeclarationId(null); }}>
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0a2540]">{editingDeclarationId ? "Modifier la declaration" : "Nouvelle declaration mensuelle"}</h3>
                <button onClick={() => { setShowNew(false); setEditingDeclarationId(null); }}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Entreprise principale</label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#0a2540] font-medium">
                      {primeDetails.name || "Chargement..."}
                    </div>
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
                    <label className="text-sm font-medium text-gray-700">Paiements aux sous-traitants</label>
                    <button onClick={addLine} className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline"><Plus className="w-3 h-3" />Ajouter une ligne</button>
                  </div>

                  <div className="space-y-3">
                    {lines.map((line, i) => (
                      <div key={i} className="bg-[#F6F9FC] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">Ligne {i + 1}</span>
                            {!line.manualEntry && line.document_type && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${docTypeConfig[line.document_type]?.color || docTypeConfig.manual.color}`}>
                                {docTypeConfig[line.document_type]?.label || 'Manuel'}
                              </span>
                            )}
                            {line.manualEntry && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${docTypeConfig.manual.color}`}>
                                {docTypeConfig.manual.label}
                              </span>
                            )}
                          </div>
                          {lines.length > 1 && (
                            <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {!line.manualEntry && primeContracts.length > 0 ? (
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-1 block">Selectionner un contrat/BC</label>
                              <select 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                                value={line.contract_id || ""}
                                onChange={(e) => {
                                  if (e.target.value === "manual") {
                                    toggleManualEntry(i);
                                  } else {
                                    selectContractForLine(i, e.target.value);
                                  }
                                }}
                              >
                                <option value="">-- Choisir --</option>
                                {primeContracts.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.subcontractor_name || c.subcontractor_email} | {c.reference} | {c.document_type === 'contract' ? 'Contrat' : 'BC'} | USD {c.value}
                                  </option>
                                ))}
                                <option value="manual">-- Saisie manuelle --</option>
                              </select>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                const updated = [...lines];
                                updated[i] = { ...updated[i], manualEntry: false };
                                setLines(updated);
                              }}
                              className="flex items-center gap-1 text-xs text-[#007FFF] hover:underline"
                            >
                              <Link2 className="w-3 h-3" />
                              Lier a un contrat/BC existant
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3">
                            <label className="text-xs text-gray-500 mb-1 block">Sous-traitant</label>
                            <input 
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" 
                              placeholder="Nom..." 
                              value={line.subcontractor_name} 
                              onChange={(e) => updateLine(i, "subcontractor_name", e.target.value)} 
                              readOnly={!line.manualEntry && line.contract_id}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Activite</label>
                            <input 
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" 
                              placeholder="Activite..." 
                              value={line.activity_type} 
                              onChange={(e) => updateLine(i, "activity_type", e.target.value)} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Ref contrat</label>
                            <input 
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm" 
                              placeholder="REF-001" 
                              value={line.contract_ref} 
                              onChange={(e) => updateLine(i, "contract_ref", e.target.value)} 
                              readOnly={!line.manualEntry && line.contract_id}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Valeur contrat (USD)</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50" 
                              placeholder="0.00" 
                              value={line.amount_htva} 
                              readOnly
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-xs text-emerald-700 font-medium mb-1 block">Montant paye ce mois (USD)</label>
                            <input 
                              type="number" 
                              className="w-full px-2 py-1.5 border border-emerald-200 rounded text-sm focus:border-emerald-500 outline-none" 
                              placeholder="0.00" 
                              value={line.amount_paid} 
                              onChange={(e) => updateLine(i, "amount_paid", e.target.value)} 
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="text-xs text-gray-500">
                            ARSP sur montant paye: <span className="font-semibold text-red-600">${((parseFloat(line.amount_paid) || parseFloat(line.amount_htva) || 0) * 0.012).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a2540] rounded-xl p-4 text-white">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-300 mb-1">Total valeur contrats</p>
                      <p className="text-lg font-bold">${calculateTotalHtva().toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300 mb-1">Total paye ce mois</p>
                      <p className="text-lg font-bold text-emerald-300">${calculateTotalPaid().toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-300 mb-1">ARSP du (1.2%)</p>
                      <p className="text-xl font-bold text-amber-400">${calculateArsp().toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Preuve de paiement ARSP</label>
                  <div className={"border-2 border-dashed rounded-xl p-4 text-center " + (proofFile ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-[#007FFF]")}>
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="proof-upload" onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)} />
                    <label htmlFor="proof-upload" className="cursor-pointer text-xs text-[#007FFF] hover:underline">{proofFile ? proofFile.name : "Cliquer pour uploader la preuve de paiement"}</label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleSubmit("draft")} disabled={submitting} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50">{editingDeclarationId ? "Enregistrer modifications" : "Enregistrer brouillon"}</button>
                  <button onClick={() => handleSubmit("submitted")} disabled={submitting || !primeDetails.name} className="flex-1 py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] disabled:opacity-50">{submitting ? "Envoi..." : "Soumettre la declaration"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDeclaration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDeclaration(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0a2540]">Declaration {selectedDeclaration.month} {selectedDeclaration.year}</h3>
                  <p className="text-sm text-gray-500">{selectedDeclaration.prime_name} — {selectedDeclaration.prime_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {auth.userRole === 'prime' && selectedDeclaration.status === 'draft' && (
                    <>
                      <button 
                        onClick={() => { handleEditDeclaration(selectedDeclaration); setSelectedDeclaration(null); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />Modifier
                      </button>
                      <button 
                        onClick={() => { handleDeleteDeclaration(selectedDeclaration.id); setSelectedDeclaration(null); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash className="w-4 h-4" />Supprimer
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedDeclaration(null)}><X className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={"px-2 py-0.5 rounded-full text-xs font-bold uppercase " + (statusConfig[selectedDeclaration.status] ? statusConfig[selectedDeclaration.status].color : "")}>
                  {statusConfig[selectedDeclaration.status] ? statusConfig[selectedDeclaration.status].label : ""}
                </span>
                <span className="text-xs text-gray-400">
                  Soumise le: {selectedDeclaration.submitted_at ? new Date(selectedDeclaration.submitted_at).toLocaleDateString('fr-FR') : 'Non soumise'}
                </span>
                <span className="text-xs text-gray-400">
                  Creee le: {new Date(selectedDeclaration.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {auth.userRole === "admin" && declarationLines.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-[#F6F9FC] rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Lignes declarees</p>
                    <p className="text-2xl font-bold text-[#0a2540]">{declarationLines.length}</p>
                  </div>
                  <div className="bg-[#F6F9FC] rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Valeur totale contrats</p>
                    <p className="text-2xl font-bold text-[#0a2540]">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_htva), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                    <p className="text-xs text-emerald-600 mb-1">Total paye ce mois</p>
                    <p className="text-2xl font-bold text-emerald-700">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_paid || l.amount_htva), 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <p className="text-xs text-amber-600 mb-1">ARSP du (1.2%)</p>
                    <p className="text-2xl font-bold text-amber-700">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_arsp), 0).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {auth.userRole === "admin" && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
                  <h4 className="text-sm font-semibold text-[#1a237e] mb-2">Entreprise declarante</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div><span className="text-gray-400">Nom:</span> {selectedDeclaration.prime_name}</div>
                    <div><span className="text-gray-400">Email:</span> {selectedDeclaration.prime_email}</div>
                    <div><span className="text-gray-400">Mois:</span> {selectedDeclaration.month}</div>
                    <div><span className="text-gray-400">Annee:</span> {selectedDeclaration.year}</div>
                  </div>
                </div>
              )}

              {linesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-[#007FFF] border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">Chargement des lignes...</p>
                </div>
              ) : declarationLines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a2540] text-white">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Sous-traitant</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Activite</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold">Ref</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold">Valeur (USD)</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold">Paye (USD)</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold">ARSP (USD)</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {declarationLines.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${docTypeConfig[line.document_type]?.color || docTypeConfig.manual.color}`}>
                              {docTypeConfig[line.document_type]?.label || 'Manuel'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs font-medium text-[#0a2540]">{line.subcontractor_name}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{line.activity_type}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{line.contract_ref}</td>
                          <td className="px-3 py-2 text-xs text-right">${parseFloat(line.amount_htva).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-emerald-600">${parseFloat(line.amount_paid || line.amount_htva).toFixed(2)}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-red-600">${parseFloat(line.amount_arsp).toFixed(2)}</td>
                          <td className="px-3 py-2 text-center">
                            {line.contract_id && (
                              <button 
                                onClick={() => fetchContractDetails(line.contract_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#1a237e] bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                title="Voir le contrat"
                              >
                                <Eye className="w-3 h-3" />Voir contrat
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#0a2540] text-white">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-xs font-bold text-right">Totaux:</td>
                        <td className="px-3 py-2 text-xs font-bold text-right">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_htva), 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right text-emerald-300">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_paid || l.amount_htva), 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs font-bold text-right text-amber-400">${declarationLines.reduce((s, l) => s + parseFloat(l.amount_arsp), 0).toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune ligne de declaration</p>
                  <p className="text-xs text-gray-400 mt-1">Cette declaration ne contient aucun paiement declare.</p>
                </div>
              )}

              {selectedDeclaration.proof_of_payment_url ? (
                <a href={selectedDeclaration.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 w-fit">
                  <FileText className="w-4 h-4" />Voir la preuve de paiement
                </a>
              ) : auth.userRole === "prime" && selectedDeclaration.status !== "validated" ? (
                <div className="mt-4">
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
                <div className="bg-red-50 rounded-lg p-4 border border-red-200 mt-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Motif du rejet:</p>
                  <p className="text-sm text-red-600">{selectedDeclaration.rejection_reason}</p>
                </div>
              )}

              {auth.userRole === "admin" && selectedDeclaration.status === "submitted" && (
                <div className="mt-6 space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800 mb-3">Action administrative</p>
                    <div className="flex gap-3">
                      <button onClick={() => handleAdminAction(selectedDeclaration.id, "validated", undefined)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />Valider la declaration
                      </button>
                      <button onClick={() => { const reason = prompt("Motif du rejet:"); if (reason) handleAdminAction(selectedDeclaration.id, "rejected", reason); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" />Rejeter la declaration
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {auth.userRole === "admin" && (selectedDeclaration.status === "validated" || selectedDeclaration.status === "rejected") && (
                <div className={`mt-4 rounded-lg p-4 border ${selectedDeclaration.status === 'validated' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {selectedDeclaration.status === 'validated' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                    <span className="text-sm font-medium">
                      {selectedDeclaration.status === 'validated' ? 'Cette declaration a ete validee' : 'Cette declaration a ete rejetee'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT DETAIL MODAL */}
      {showContractModal && contractDetails && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowContractModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0a2540]">Details du contrat</h3>
                <button onClick={() => setShowContractModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Reference</p>
                    <p className="text-sm font-semibold text-[#0a2540]">{contractDetails.reference}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Titre</p>
                    <p className="text-sm font-semibold text-[#0a2540]">{contractDetails.title}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Sous-traitant</p>
                    <p className="text-sm font-semibold text-[#0a2540]">{contractDetails.subcontractor_name || contractDetails.subcontractor_email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Valeur (USD)</p>
                    <p className="text-sm font-semibold text-emerald-600">${parseFloat(contractDetails.value).toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Type de document</p>
                    <p className="text-sm font-semibold text-[#0a2540]">{contractDetails.document_type === 'contract' ? 'Contrat' : 'Bon de Commande'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Statut</p>
                    <p className="text-sm font-semibold text-[#0a2540]">{contractDetails.status === 'active' ? 'Actif' : contractDetails.status === 'completed' ? 'Termine' : contractDetails.status}</p>
                  </div>
                </div>

                {contractDetails.description && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{contractDetails.description}</p>
                  </div>
                )}

                {contractDetails.file_url && (
                  <a 
                    href={contractDetails.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm hover:bg-[#0d2f4f] w-fit"
                  >
                    <FileText className="w-4 h-4" />Voir le document du contrat
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}