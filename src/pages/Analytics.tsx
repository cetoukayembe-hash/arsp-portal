import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Users, FileCheck, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// ARSP Brand Colors
const COLORS = ['#1a237e', '#007FFF', '#FFCD00', '#EF4135', '#6b7280', '#10B981', '#8b5cf6', '#f59e0b'];

export function Analytics() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('12mois');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: ent } = await supabase.from('enterprises').select('*, user_profiles(role)');
      const { data: ten } = await supabase.from('tenders').select('*');
      const { data: con } = await supabase.from('contracts').select('*');
      const { data: usr } = await supabase.from('user_profiles').select('*');
      if (ent) setEnterprises(ent);
      if (ten) setTenders(ten);
      if (con) setContracts(con);
      if (usr) setUsers(usr);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Real sector distribution
  const sectorCount = enterprises.reduce((acc: Record<string, number>, e) => {
    if (e.sector) acc[e.sector] = (acc[e.sector] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(sectorCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Real province distribution
  const provinceCount = enterprises.reduce((acc: Record<string, number>, e) => {
    if (e.province) acc[e.province] = (acc[e.province] || 0) + 1;
    return acc;
  }, {});
  const provinceData = Object.entries(provinceCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Role distribution
  const roleCount = enterprises.reduce((acc: Record<string, number>, e) => {
    const role = e.user_profiles?.role || 'Non categorise';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const roleData = Object.entries(roleCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Status distribution
  const statusCount = enterprises.reduce((acc: Record<string, number>, e) => {
    const status = e.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCount)
    .map(([name, value]) => ({ 
      name: name === 'active' ? 'Actif' : 
            name === 'pending' ? 'En attente' : 
            name === 'rejected' ? 'Rejete' : 
            name === 'suspended' ? 'Suspendu' : name,
      value 
    }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Monthly registration trend
  const monthlyData = (() => {
    const months: Record<string, { registrations: number; approvals: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('fr-FR', { month: 'short' });
      months[key] = { registrations: 0, approvals: 0 };
    }
    
    enterprises.forEach(e => {
      if (e.created_at) {
        const d = new Date(e.created_at);
        const key = d.toLocaleDateString('fr-FR', { month: 'short' });
        if (months[key]) months[key].registrations++;
        if (e.status === 'active' && months[key]) months[key].approvals++;
      }
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      registrations: data.registrations,
      approvals: data.approvals,
    }));
  })();

  // Compliance scores
  const complianceTrend = (() => {
    const months: Record<string, number[]> = {};
    enterprises.forEach(e => {
      if (e.created_at && e.compliance_score) {
        const d = new Date(e.created_at);
        const key = d.toLocaleDateString('fr-FR', { month: 'short' });
        if (!months[key]) months[key] = [];
        months[key].push(e.compliance_score);
      }
    });
    
    const allMonths = Object.keys(months).sort();
    return allMonths.map(month => ({
      month,
      score: months[month].length > 0 
        ? Math.round(months[month].reduce((a, b) => a + b, 0) / months[month].length) 
        : 0,
    }));
  })();

  const activeEnterprises = enterprises.filter(e => e.status === 'active').length;
  const pendingApprovals = enterprises.filter(e => e.status === 'pending').length;
  const rejectedCount = enterprises.filter(e => e.status === 'rejected').length;
  const suspendedCount = enterprises.filter(e => e.status === 'suspended').length;
  const activeTenders = tenders.filter(t => t.status === 'open').length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Entreprise', 'Email', 'Secteur', 'Province', 'Role', 'Capital Congolais', 'Statut', 'Date Creation'];
    const rows = enterprises.map(e => [
      e.name,
      e.email,
      e.sector || 'N/A',
      e.province || 'N/A',
      e.user_profiles?.role || 'Non categorise',
      `${e.congolese_capital}%`,
      e.status,
      new Date(e.created_at).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ARSP_Enterprises_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Excel Export with styling
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'ARSP Analytics Report',
      Subject: 'Enterprise Analytics',
      Author: 'ARSP Portal',
      CreatedDate: new Date(),
    };

    // Summary sheet
    const summaryData = [
      ['ARSP - Tableau de Bord Analytics'],
      [''],
      ['Metriques cles'],
      ['Entreprises enregistrees', enterprises.length],
      ['Entreprises actives', activeEnterprises],
      ['En attente', pendingApprovals],
      ['Rejetees', rejectedCount],
      ['Suspendues', suspendedCount],
      ['Appels d\'offres actifs', activeTenders],
      ['Contrats actifs', activeContracts],
      [''],
      ['Repartition par role'],
      ['Role', 'Nombre'],
      ...roleData.map(r => [r.name, r.value]),
      [''],
      ['Repartition par statut'],
      ['Statut', 'Nombre'],
      ...statusData.map(s => [s.name, s.value]),
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resume');

    // Enterprises sheet
    const enterpriseHeaders = ['Entreprise', 'Email', 'Secteur', 'Province', 'Role', 'Capital Congolais', 'Statut', 'Date Creation'];
    const enterpriseRows = enterprises.map(e => [
      e.name,
      e.email,
      e.sector || 'N/A',
      e.province || 'N/A',
      e.user_profiles?.role || 'Non categorise',
      `${e.congolese_capital}%`,
      e.status,
      new Date(e.created_at).toLocaleDateString('fr-FR')
    ]);

    const enterpriseWs = XLSX.utils.aoa_to_sheet([enterpriseHeaders, ...enterpriseRows]);
    enterpriseWs['!cols'] = [
      { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, enterpriseWs, 'Entreprises');

    // Sector distribution sheet
    const sectorWs = XLSX.utils.aoa_to_sheet([
      ['Secteur', 'Nombre d\'entreprises'],
      ...pieData.map(s => [s.name, s.value])
    ]);
    XLSX.utils.book_append_sheet(wb, sectorWs, 'Secteurs');

    // Province distribution sheet
    const provinceWs = XLSX.utils.aoa_to_sheet([
      ['Province', 'Nombre d\'entreprises'],
      ...provinceData.map(p => [p.name, p.value])
    ]);
    XLSX.utils.book_append_sheet(wb, provinceWs, 'Provinces');

    XLSX.writeFile(wb, `ARSP_Rapport_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const element = reportRef.current;
      const originalHeight = element.style.height;
      element.style.height = 'auto';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
        y: 0,
      });
      
      element.style.height = originalHeight;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      
      let heightLeft = scaledHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`ARSP_Rapport_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Erreur lors de l\'export PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="h-10 w-auto" />
          <h2 className="text-2xl font-bold text-[#1a237e]">Tableau de Bord ARSP</h2>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
          >
            <option value="7jours">7 derniers jours</option>
            <option value="30jours">30 derniers jours</option>
            <option value="12mois">12 derniers mois</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-lg text-sm font-medium hover:bg-[#0d1642]"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <FileText className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-[#1a237e] text-[#1a237e] rounded-lg text-sm font-medium hover:bg-[#1a237e] hover:text-white"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-[#1a237e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Entreprises enregistrees</span>
              <Users className="w-5 h-5 text-[#1a237e]" />
            </div>
            <div className="text-2xl font-bold text-[#1a237e]">{enterprises.length}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />{activeEnterprises} agreees
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-[#FFCD00]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Agrements en attente</span>
              <FileCheck className="w-5 h-5 text-[#FFCD00]" />
            </div>
            <div className="text-2xl font-bold text-[#1a237e]">{pendingApprovals}</div>
            <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />en attente de validation
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-[#007FFF]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Appels d'offres actifs</span>
              <Calendar className="w-5 h-5 text-[#007FFF]" />
            </div>
            <div className="text-2xl font-bold text-[#1a237e]">{activeTenders}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />en cours
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 card-shadow border-l-4 border-[#10B981]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Contrats actifs</span>
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-2xl font-bold text-[#1a237e]">{activeContracts}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />en execution
            </div>
          </div>
        </div>

        {/* Status KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{activeEnterprises}</div>
            <div className="text-xs text-emerald-600">Actives</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{pendingApprovals}</div>
            <div className="text-xs text-amber-600">En attente</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{rejectedCount}</div>
            <div className="text-xs text-red-600">Rejetees</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{suspendedCount}</div>
            <div className="text-xs text-gray-600">Suspendues</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Tendances d'inscription (reel)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="registrations" name="Inscriptions" stroke="#1a237e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approvals" name="Agrements" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Repartition par secteur (reel)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={pieData.length > 0 ? pieData : [{ name: 'Aucune donnee', value: 1 }]} 
                  cx="50%" cy="50%" 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={4} 
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {(pieData.length > 0 ? pieData : [{ name: 'Aucune donnee', value: 1 }]).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Repartition geographique (reel)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={provinceData.length > 0 ? provinceData : [{ name: 'Aucune', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Entreprises" fill="#1a237e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Repartition par role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={roleData.length > 0 ? roleData : [{ name: 'Aucune donnee', value: 1 }]} 
                  cx="50%" cy="50%" 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={4} 
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {(roleData.length > 0 ? roleData : [{ name: 'Aucune donnee', value: 1 }]).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Repartition par statut</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={statusData.length > 0 ? statusData : [{ name: 'Aucune donnee', value: 1 }]} 
                  cx="50%" cy="50%" 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={4} 
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {(statusData.length > 0 ? statusData : [{ name: 'Aucune donnee', value: 1 }]).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 card-shadow">
            <h3 className="text-sm font-semibold text-[#1a237e] mb-4">Evolution conformite (reel)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={complianceTrend.length > 0 ? complianceTrend : [{ month: '-', score: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" name="Score moyen" stroke="#FFCD00" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="h-6 w-auto" />
          <h3 className="text-sm font-semibold text-[#1a237e]">Entreprises enregistrees</h3>
        </div>
        {enterprises.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune entreprise enregistree</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F6F9FC]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Entreprise</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Secteur</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Province</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Capital %</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1a237e]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enterprises.slice(0, 20).map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1a237e]">{e.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.sector}</td>
                    <td className="px-4 py-3 text-gray-600">{e.province}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{e.user_profiles?.role || 'Non categorise'}</td>
                    <td className="px-4 py-3 text-gray-600">{e.congolese_capital}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        e.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        e.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        e.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {e.status === 'active' ? 'Agree' : e.status === 'pending' ? 'En attente' : e.status === 'rejected' ? 'Rejete' : 'Suspendu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enterprises.length > 20 && (
              <div className="p-3 text-center text-xs text-gray-400">
                ...et {enterprises.length - 20} autres entreprises
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}