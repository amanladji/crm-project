import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      console.log('🔐 Login attempt for user:', username);
      const response = await authService.login(username, password);
      
      console.log('✅ Login successful');
      console.log('Response contains token:', !!response.token);
      
      // Verify token is in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        console.log('✅ VERIFIED: Token found in localStorage with key "token"');
        console.log('Token starts with:', token.substring(0, 20) + '...');
      } else {
        console.error('❌ ERROR: Token NOT found in localStorage');
      }
      
      console.log('🔀 Redirecting to dashboard...');
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      // Extract error message from response
      let errorMsg = 'Invalid username or password. Please try again.';
      
      if (err.response?.data?.message) {
        // Backend returned ErrorResponse with message field
        errorMsg = err.response.data.message;
      } else if (err.response?.data) {
        // Handle other response formats
        errorMsg = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-indigo-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[-10%] -left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[20%] -right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Focus CRM<span className="text-blue-400">.</span></h1>
          <p className="text-xl text-blue-100 leading-relaxed mb-8">
            The ultimate platform to manage your customer relationships, boost productivity, and skyrocket your sales.
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-blue-900 flex items-center justify-center text-sm font-bold">JD</div>
              <div className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-blue-900 flex items-center justify-center text-sm font-bold">SM</div>
              <div className="w-10 h-10 rounded-full bg-purple-400 border-2 border-blue-900 flex items-center justify-center text-sm font-bold">+5</div>
            </div>
            <p className="text-sm font-medium text-blue-200">Join thousands of professionals</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                Username
              </label>
              <input 
                type="text" 
                id="username" 
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            {message && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{message}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/40 hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-indigo-600 font-bold transition-colors">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;