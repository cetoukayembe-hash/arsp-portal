import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Users, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const monthlyData = [
  { month: 'Jan', registrations: 45, approvals: 38 },
  { month: 'Fev', registrations: 52, approvals: 44 },
  { month: 'Mar', registrations: 48, approvals: 41 },
  { month: 'Avr', registrations: 61, approvals: 55 },
  { month: 'Mai', registrations: 55, approvals: 49 },
  { month: 'Juin', registrations: 67, approvals: 58 },
  { month: 'Juil', registrations: 72, approvals: 63 },
  { month: 'Aout', registrations: 58, approvals: 51 },
  { month: 'Sep', registrations: 65, approvals: 57 },
  { month: 'Oct', registrations: 70, approvals: 62 },
  { month: 'Nov', registrations: 78, approvals: 69 },
  { month: 'Dec', registrations: 82, approvals: 74 },
];

const provinceData = [
  { name: 'Kinshasa', value: 420 },
  { name: 'Haut-Katanga', value: 280 },
  { name: 'Lualaba', value: 190 },
  { name: 'Kongo Central', value: 150 },
  { name: 'Nord-Kivu', value: 120 },
  { name: 'Autres', value: 180 },
];

const complianceTrend = [
  { month: 'Jan', score: 78 },
  { month: 'Fev', score: 80 },
  { month: 'Mar', score: 79 },
  { month: 'Avr', score: 82 },
  { month: 'Mai', score: 83 },
  { month: 'Juin', score: 85 },
  { month: 'Juil', score: 84 },
  { month: 'Aout', score: 86 },
  { month: 'Sep', score: 87 },
  { month: 'Oct', score: 88 },
  { month: 'Nov', score: 89 },
  { month: 'Dec', score: 91 },
];

const COLORS = ['#0a2540', '#007FFF', '#FFD700', '#DC143C', '#10B981', '#8b5cf6'];

export function Analytics() {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('12mois');

  useEffect(() => {
    async function fetchData() {
      const { data: ent } = await supabase.from('enterprises').select('*');
      const { data: ten } = await supabase.from('tenders').select('*');
      const { data: con } = await supabase.from('contracts').select('*');
      if (ent) setEnterprises(ent);
      if (ten) setTenders(ten);
      if (con) setContracts(con);
    }
    fetchData();
  }, []);

  const sectorCount = enterprises.reduce((acc: Record<string, number>, e) => {
    if (e.sector) acc[e.sector] = (acc[e.sector] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(sectorCount).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#0a2540]">Analytics & Reporting ARSP</h2>
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
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg text-sm font-medium hover:bg-[#0d2f4f]">
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Entreprises enregistrees</span>
            <Users className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">{enterprises.length}</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />donnees en temps reel
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Agrements en attente</span>
            <FileCheck className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">
            {enterprises.filter(e => e.status === 'pending').length}
          </div>
          <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3" />en attente de validation
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Appels d'offres actifs</span>
            <Calendar className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">
            {tenders.filter(t => t.status === 'open').length}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />en cours
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Contrats actifs</span>
            <CheckCircle2 className="w-5 h-5 text-[#007FFF]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540]">
            {contracts.filter(c => c.status === 'active').length}
          </div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />en execution
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Tendances d'inscription</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="registrations" name="Inscriptions" stroke="#007FFF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="approvals" name="Agrements" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Repartition par secteur</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData.length > 0 ? pieData : [{ name: 'Aucune donnee', value: 1 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
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
          <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Repartition geographique</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={provinceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Entreprises" fill="#0a2540" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold text-[#0a2540] mb-4">Evolution conformite (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={complianceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" name="Score moyen" stroke="#FFD700" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-[#0a2540]">Entreprises enregistrees</h3>
        </div>
        {enterprises.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune entreprise enregistree</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F6F9FC]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Entreprise</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Secteur</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Province</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Capital %</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#0a2540]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enterprises.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#0a2540]">{e.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.sector}</td>
                    <td className="px-4 py-3 text-gray-600">{e.province}</td>
                    <td className="px-4 py-3 text-gray-600">{e.congolese_capital}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        e.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        e.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {e.status === 'active' ? 'Agree' : e.status === 'pending' ? 'En attente' : 'Suspendu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}