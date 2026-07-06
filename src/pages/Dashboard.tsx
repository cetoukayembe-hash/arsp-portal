import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { supabase } from "@/lib/supabase";
import { FileText, Briefcase, MessageSquare, CreditCard, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, ShieldCheck, BarChart3, ArrowRight } from "lucide-react";

export function Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enterprises: 0,
    pendingApprovals: 0,
    activeTenders: 0,
    activeContracts: 0,
    pendingDeclarations: 0,
    totalArspDue: 0,
    myContracts: 0,
    myTenders: 0,
    unreadMessages: 0,
    myDeclarations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [enterprise, setEnterprise] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    if (auth.userRole === "admin") {
      const { count: entCount } = await supabase.from("enterprises").select("*", { count: "exact", head: true });
      const { count: pendingCount } = await supabase.from("enterprises").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: tenderCount } = await supabase.from("tenders").select("*", { count: "exact", head: true }).eq("status", "open");
      const { count: contractCount } = await supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: declCount } = await supabase.from("declarations").select("*", { count: "exact", head: true }).eq("status", "submitted");
      const { data: declData } = await supabase.from("declaration_lines").select("amount_arsp");
      const totalArsp = declData ? declData.reduce((s, d) => s + parseFloat(d.amount_arsp || 0), 0) : 0;
      setStats(s => ({ ...s, enterprises: entCount || 0, pendingApprovals: pendingCount || 0, activeTenders: tenderCount || 0, activeContracts: contractCount || 0, pendingDeclarations: declCount || 0, totalArspDue: totalArsp }));
    } else if (auth.userRole === "prime") {
      const { count: tenderCount } = await supabase.from("tenders").select("*", { count: "exact", head: true });
      const { count: contractCount } = await supabase.from("contracts").select("*", { count: "exact", head: true }).eq("prime_email", auth.userEmail);
      const { count: declCount } = await supabase.from("declarations").select("*", { count: "exact", head: true }).eq("prime_email", auth.userEmail);
      setStats(s => ({ ...s, myTenders: tenderCount || 0, myContracts: contractCount || 0, myDeclarations: declCount || 0 }));
    } else {
      const { data: ent } = await supabase.from("enterprises").select("*").eq("email", auth.userEmail).single();
      if (ent) setEnterprise(ent);
      const { count: tenderCount } = await supabase.from("tenders").select("*", { count: "exact", head: true }).eq("status", "open");
      const { count: contractCount } = await supabase.from("contracts").select("*", { count: "exact", head: true }).eq("subcontractor_email", auth.userEmail);
      setStats(s => ({ ...s, activeTenders: tenderCount || 0, myContracts: contractCount || 0 }));
    }
    setLoading(false);
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon apres-midi";
    return "Bonsoir";
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div>
      {/* Welcome */}
      <div className="bg-[#0a2540] rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{greeting()}, bienvenue sur le portail ARSP</h2>
          <p className="text-blue-200 text-sm">{auth.userEmail}</p>
          <span className={"mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold " + (auth.userRole === "admin" ? "bg-amber-500 text-white" : auth.userRole === "prime" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white")}>
            {auth.userRole === "admin" ? "Administrateur ARSP" : auth.userRole === "prime" ? "Entreprise Donneuse d'Ordres" : "Entreprise de Sous-traitance"}
          </span>
        </div>
        <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shrink-0" />
      </div>

      {/* Admin Dashboard */}
      {auth.userRole === "admin" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div onClick={() => navigate("/enterprise-search")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Entreprises enregistrees</span>
                <Users className="w-5 h-5 text-[#007FFF]" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.enterprises}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#007FFF]">Voir le registre <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/approvals")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Approbations en attente</span>
                <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-500">{stats.pendingApprovals}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">Voir les approbations <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/analytics")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Appels d offres actifs</span>
                <Briefcase className="w-5 h-5 text-[#007FFF]" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.activeTenders}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#007FFF]">Voir analytics <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/declarations")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Declarations a valider</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-500">{stats.pendingDeclarations}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">Voir les declarations <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/contracts")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Contrats actifs</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-emerald-500">{stats.activeContracts}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">Voir les contrats <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div className="bg-white rounded-xl p-5 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total du a lARSP</span>
                <CreditCard className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-500">${stats.totalArspDue.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-2">Cumul des declarations</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Actions rapides</h3>
              <div className="space-y-2">
                {[
                  { label: "Approuver des entreprises", path: "/approvals", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                  { label: "Voir les declarations", path: "/declarations", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                  { label: "Creer une facture", path: "/payments", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                  { label: "Voir les litiges", path: "/disputes", color: "bg-red-50 text-red-700 hover:bg-red-100" },
                ].map((action) => (
                  <button key={action.path} onClick={() => navigate(action.path)} className={"w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between " + action.color}>
                    {action.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Statistiques rapides</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Taux d approbation</span>
                  <span className="text-sm font-bold text-emerald-600">{stats.enterprises > 0 ? Math.round(((stats.enterprises - stats.pendingApprovals) / stats.enterprises) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: stats.enterprises > 0 ? Math.round(((stats.enterprises - stats.pendingApprovals) / stats.enterprises) * 100) + "%" : "0%" }} />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-gray-500">Declarations validees</span>
                  <span className="text-sm font-bold text-blue-600">{stats.pendingDeclarations} en attente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prime Dashboard */}
      {auth.userRole === "prime" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div onClick={() => navigate("/tenders")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Appels d offres</span>
                <Briefcase className="w-5 h-5 text-[#007FFF]" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.myTenders}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#007FFF]">Voir les appels d offres <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/contracts")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Mes contrats</span>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.myContracts}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">Voir les contrats <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/declarations")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Mes declarations</span>
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.myDeclarations}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">Voir les declarations <ArrowRight className="w-3 h-3" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Actions rapides</h3>
              <div className="space-y-2">
                {[
                  { label: "Creer un appel d offres", path: "/tenders", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                  { label: "Nouvelle declaration mensuelle", path: "/declarations", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                  { label: "Creer un contrat", path: "/contracts", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                  { label: "Voir mes paiements", path: "/payments", color: "bg-red-50 text-red-700 hover:bg-red-100" },
                ].map((action) => (
                  <button key={action.path} onClick={() => navigate(action.path)} className={"w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between " + action.color}>
                    {action.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Rappels importants</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Declaration mensuelle</p>
                    <p className="text-xs text-amber-600">A soumettre avant le 7 de chaque mois</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Paiement ARSP</p>
                    <p className="text-xs text-blue-600">1.2% du montant HTVA paye aux sous-traitants</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">Sous-traitants agrees</p>
                    <p className="text-xs text-emerald-600">Verifiez que vos sous-traitants sont agrees ARSP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subcontractor Dashboard */}
      {auth.userRole === "subcontractor" && (
        <div>
          {enterprise && (
            <div className={"rounded-xl p-4 mb-6 flex items-center gap-3 " + (enterprise.status === "active" ? "bg-emerald-50 border border-emerald-200" : enterprise.status === "pending" ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200")}>
              {enterprise.status === "active" ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : enterprise.status === "pending" ? <Clock className="w-5 h-5 text-amber-500 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
              <div>
                <p className={"text-sm font-semibold " + (enterprise.status === "active" ? "text-emerald-700" : enterprise.status === "pending" ? "text-amber-700" : "text-red-700")}>
                  {enterprise.status === "active" ? "Votre entreprise est agreee ARSP" : enterprise.status === "pending" ? "Votre demande est en cours de traitement" : "Votre demande a ete rejetee"}
                </p>
                <p className={"text-xs " + (enterprise.status === "active" ? "text-emerald-600" : enterprise.status === "pending" ? "text-amber-600" : "text-red-600")}>
                  {enterprise.name}
                </p>
              </div>
            </div>
          )}

          {!enterprise && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">Inscription requise</p>
                <p className="text-xs text-amber-600">Vous devez inscrire votre entreprise pour acceder a toutes les fonctionnalites.</p>
              </div>
              <button onClick={() => navigate("/register")} className="ml-auto px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 shrink-0">
                S inscrire
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div onClick={() => navigate("/tenders")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Appels d offres disponibles</span>
                <Briefcase className="w-5 h-5 text-[#007FFF]" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.activeTenders}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#007FFF]">Voir les offres <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/contracts")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Mes contrats</span>
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">{stats.myContracts}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">Voir les contrats <ArrowRight className="w-3 h-3" /></div>
            </div>
            <div onClick={() => navigate("/messages")} className="bg-white rounded-xl p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Messagerie</span>
                <MessageSquare className="w-5 h-5 text-violet-500" />
              </div>
              <div className="text-3xl font-bold text-[#0a2540]">0</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-violet-500">Voir les messages <ArrowRight className="w-3 h-3" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Actions rapides</h3>
              <div className="space-y-2">
                {[
                  { label: "Voir les appels d offres", path: "/tenders", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                  { label: "Matching intelligent", path: "/matching", color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
                  { label: "Mes contrats", path: "/contracts", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                  { label: "Ma carte numerique", path: "/digital-id", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                ].map((action) => (
                  <button key={action.path} onClick={() => navigate(action.path)} className={"w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between " + action.color}>
                    {action.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 card-shadow">
              <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Conseils ARSP</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Maintenez votre conformite</p>
                    <p className="text-xs text-blue-600">Renouvelez vos documents avant expiration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">Optimisez votre profil</p>
                    <p className="text-xs text-emerald-600">Un profil complet augmente vos chances de matching</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
