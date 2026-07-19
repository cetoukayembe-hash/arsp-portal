import re

with open('src/pages/PaymentVerification.tsx', 'r') as f:
    content = f.read()

# 1. Replace state lines
old_state = """  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');"""

new_state = """  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPrime, setFilterPrime] = useState('all');"""

content = content.replace(old_state, new_state)

# 2. Replace filter logic
old_filter = """  const filteredTransfers = transfers.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery && !t.prime_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !t.transfer_reference?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });"""

new_filter = """  const uniquePrimes = Array.from(new Set(transfers.map(t => t.prime_name).filter(Boolean)));

  const filteredTransfers = transfers.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterMonth !== 'all' && t.month !== filterMonth) return false;
    if (filterYear !== 'all' && t.year?.toString() !== filterYear) return false;
    if (filterPrime !== 'all' && t.prime_name !== filterPrime) return false;
    if (searchQuery && !t.prime_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !t.transfer_reference?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });"""

content = content.replace(old_filter, new_filter)

# 3. Replace filter UI
old_ui = """      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher entreprise ou reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="verified">Verifies</option>
          <option value="rejected">Rejetes</option>
        </select>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
n          Exporter Excel
n        </button>
n      </div>"""

new_ui = """      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 border">
n        <div className="flex-1 min-w-[200px]">
n          <div className="relative">
n            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
n            <input
n              type="text"
n              placeholder="Rechercher entreprise ou reference..."
n              value={searchQuery}
n              onChange={(e) => setSearchQuery(e.target.value)}
n              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] focus:border-[#007FFF]"
n            />
n          </div>
n        </div>
n        <select
n          value={filterStatus}
n          onChange={(e) => setFilterStatus(e.target.value as any)}
n          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
n        >
n          <option value="all">Tous les statuts</option>
n          <option value="pending">En attente</option>
n          <option value="verified">Verifies</option>
n          <option value="rejected">Rejetes</option>
n        </select>
n        <select
n          value={filterMonth}
n          onChange={(e) => setFilterMonth(e.target.value)}
n          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
n        >
n          <option value="all">Tous les mois</option>
n          <option value="Janvier">Janvier</option>
n          <option value="Fevrier">Fevrier</option>
n          <option value="Mars">Mars</option>
n          <option value="Avril">Avril</option>
n          <option value="Mai">Mai</option>
n          <option value="Juin">Juin</option>
n          <option value="Juillet">Juillet</option>
n          <option value="Aout">Aout</option>
n          <option value="Septembre">Septembre</option>
n          <option value="Octobre">Octobre</option>
n          <option value="Novembre">Novembre</option>
n          <option value="Decembre">Decembre</option>
n        </select>
n        <select
n          value={filterYear}
n          onChange={(e) => setFilterYear(e.target.value)}
n          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF]"
n        >
n          <option value="all">Toutes les annees</option>
n          <option value="2024">2024</option>
n          <option value="2025">2025</option>
n          <option value="2026">2026</option>
n          <option value="2027">2027</option>
n        </select>
n        <select
n          value={filterPrime}
n          onChange={(e) => setFilterPrime(e.target.value)}
n          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#007FFF] min-w-[180px]"
n        >
n          <option value="all">Toutes les entreprises</option>
n          {uniquePrimes.map(prime => (
n            <option key={prime} value={prime}>{prime}</option>
n          ))}
n        </select>
n        <button
n          onClick={exportToExcel}
n          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
n        >
n          <Download className="w-4 h-4" />
n          Exporter Excel
n        </button>
n      </div>"""

content = content.replace(old_ui, new_ui)

with open('src/pages/PaymentVerification.tsx', 'w') as f:
    f.write(content)

print('Done! Added month, year, and prime filters.')
