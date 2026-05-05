function Register() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>
        <input type="text" placeholder="Full Name" className="w-full border p-3 rounded-lg mb-4" />
        <input type="email" placeholder="Email" className="w-full border p-3 rounded-lg mb-4" />
        <input type="password" placeholder="Password" className="w-full border p-3 rounded-lg mb-4" />
        <input type="password" placeholder="Confirm Password" className="w-full border p-3 rounded-lg mb-6" />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
          Create Account
        </button>
        <p className="text-center text-gray-600 mt-4">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </div>
    </div>
  )
}

export default Register