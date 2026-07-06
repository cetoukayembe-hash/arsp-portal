import { useState, useEffect } from "react";
import { Bell, Globe, LogOut, ChevronDown, X } from "lucide-react";
import { useAuth } from "@/App";
import { supabase } from "@/lib/supabase";

export function Header() {
  const auth = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState("FR");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (auth.isAuthenticated) fetchNotifications();
  }, [auth.isAuthenticated, auth.userRole]);

    async function fetchNotifications() {
    const notifs: any[] = [];
    const today = new Date();
    const dayOfMonth = today.getDate();
    const currentMonth = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"][today.getMonth()];
    const currentYear = today.getFullYear();

    // Fetch persistent notifications from database
    if (auth.userId) {
      const { data: dbNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (dbNotifs) {
        dbNotifs.forEach((n) => {
          notifs.push({
            id: n.id,
            message: n.message,
            type: n.type === 'new_contract' ? 'warning' : n.type === 'contract_accepted' ? 'success' : n.type === 'contract_rejected' ? 'error' : 'info',
            time: new Date(n.created_at).toLocaleDateString('fr-FR'),
            link: n.related_type === 'contract' ? '/contracts' : '/dashboard',
            isDb: true,
            dbId: n.id,
          });
        });
      }
    }

    // System-generated notifications (existing logic)
    if (auth.userRole === "admin") {
      const { count: pendingApprovals } = await supabase.from("enterprises").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (pendingApprovals && pendingApprovals > 0) notifs.push({ id: "approvals", message: pendingApprovals + " entreprise(s) en attente d approbation", type: "warning", time: "Maintenant", link: "/approvals", isDb: false });
      const { count: pendingDecl } = await supabase.from("declarations").select("*", { count: "exact", head: true }).eq("status", "submitted");
      if (pendingDecl && pendingDecl > 0) notifs.push({ id: "declarations", message: pendingDecl + " declaration(s) en attente de validation", type: "info", time: "Maintenant", link: "/declarations", isDb: false });
      const { count: openDisputes } = await supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open");
      if (openDisputes && openDisputes > 0) notifs.push({ id: "disputes", message: openDisputes + " litige(s) ouverts", type: "warning", time: "Maintenant", link: "/disputes", isDb: false });
    }

    if (auth.userRole === "prime") {
      if (dayOfMonth > 7) {
        const { count: myDecl } = await supabase.from("declarations").select("*", { count: "exact", head: true }).eq("prime_email", auth.userEmail).eq("month", currentMonth).eq("year", currentYear);
        if (!myDecl || myDecl === 0) notifs.push({ id: "decl-overdue", message: "Declaration de " + currentMonth + " " + currentYear + " non soumise - En retard!", type: "error", time: "Urgent", link: "/declarations", isDb: false });
      }
      const { count: pendingPayments } = await supabase.from("payments").select("*", { count: "exact", head: true }).eq("payer_email", auth.userEmail).eq("status", "pending");
      if (pendingPayments && pendingPayments > 0) notifs.push({ id: "payments", message: pendingPayments + " paiement(s) en attente", type: "warning", time: "Maintenant", link: "/payments", isDb: false });
      const { count: pendingDecl } = await supabase.from("declarations").select("*", { count: "exact", head: true }).eq("prime_email", auth.userEmail).eq("status", "rejected");
      if (pendingDecl && pendingDecl > 0) notifs.push({ id: "decl-rejected", message: pendingDecl + " declaration(s) rejetee(s) - Action requise", type: "error", time: "Maintenant", link: "/declarations", isDb: false });
    }

    if (auth.userRole === "subcontractor") {
      const { count: tenderCount } = await supabase.from("tenders").select("*", { count: "exact", head: true }).eq("status", "open");
      if (tenderCount && tenderCount > 0) notifs.push({ id: "tenders", message: tenderCount + " appel(s) d offres disponibles", type: "info", time: "Maintenant", link: "/tenders", isDb: false });
      const { data: ent } = await supabase.from("enterprises").select("status").eq("email", auth.userEmail).single();
      if (ent && ent.status === "pending") notifs.push({ id: "registration", message: "Votre inscription est en cours de traitement", type: "warning", time: "En attente", link: "/digital-id", isDb: false });
      if (ent && ent.status === "active") notifs.push({ id: "approved", message: "Votre entreprise est agreee ARSP", type: "success", time: "Actif", link: "/digital-id", isDb: false });
    }

    setNotifications(notifs);
  }

  async function markAsRead(dbId: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', dbId);
    fetchNotifications();
  }
    
    
      

  const unreadCount = notifications.length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="hidden lg:block w-8" />
        <h1 className="text-lg font-semibold text-[#0a2540] hidden sm:block">Portail Numerique ARSP</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLang(lang === "FR" ? "EN" : "FR")}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{lang}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-[#0a2540]">Notifications ({unreadCount})</span>
                <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Aucune notification</div>
                ) : notifications.map((n) => (
                  <div key={n.id} onClick={() => { if (n.isDb) markAsRead(n.dbId); setNotifOpen(false); }} className="p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className={"w-2 h-2 rounded-full mt-1.5 shrink-0 " + (n.type === "error" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : n.type === "success" ? "bg-emerald-500" : "bg-blue-500")} />
                      <div>
                        <p className="text-sm text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 text-center">
                <button onClick={() => { fetchNotifications(); setNotifOpen(false); }} className="text-xs text-[#007FFF] hover:underline">Actualiser</button>
              </div>
            </div>
          )}
        </div>

        {auth.isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold">
                {auth.userEmail ? auth.userEmail[0].toUpperCase() : "U"}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-sm text-[#0a2540] truncate">{auth.userEmail}</p>
                  <p className="text-xs text-gray-500 capitalize">{auth.userRole}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { auth.logout(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Deconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
