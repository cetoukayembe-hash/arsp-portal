import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">ARSP Portal</h1>
        <button onClick={handleLogout} style={{color:'red',cursor:'pointer',background:'none',border:'none',fontSize:'16px'}}>
          Logout
        </button>
      </nav>
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back!</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">128</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Active Sessions</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">24</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Reports</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">7</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
