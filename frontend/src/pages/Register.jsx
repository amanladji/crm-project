import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth.service';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      await authService.register(username, email, password);
      setIsSuccess(true);
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      // Extract error message from response
      let errorMsg = 'Failed to register. Please try again.';
      
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
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 to-blue-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[10%] -right-10 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[40%] -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Focus CRM<span className="text-blue-400">.</span></h1>
          <p className="text-xl text-blue-100 leading-relaxed mb-10">
            Create an account to start managing your leads, automating workflows, and building stronger customer relationships today.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span className="text-lg font-medium">Free 14-day trial included</span>
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span className="text-lg font-medium">No credit card required</span>
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span className="text-lg font-medium">Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
            <p className="text-gray-500 font-medium">Get started with Focus CRM in seconds.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">
                Username
              </label>
              <input 
                type="text" 
                id="username"
                placeholder="Choose a username"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                disabled={isSuccess || isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Work Email
              </label>
              <input 
                type="email" 
                id="email"
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                disabled={isSuccess || isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input 
                type="password" 
                id="password"
                placeholder="Create a secure password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                disabled={isSuccess || isLoading}
              />
              <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters long.</p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl border flex items-center ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'}`}>
                {isSuccess ? (
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`text-sm font-medium ${isSuccess ? 'text-green-700' : 'text-red-600'}`}>{message}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-3 px-4 mt-2 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all ${
                (isLoading || isSuccess)
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-600/40 hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : 'Create account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-blue-600 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
