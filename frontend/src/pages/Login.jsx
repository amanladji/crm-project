import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      setMessage('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg w-1/3">
        <h3 className="text-2xl font-bold text-center">Login to CRM</h3>
        <form onSubmit={handleLogin}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="username">Username</label>
              <input type="text" id="username" placeholder="Username"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex items-baseline justify-between mt-4">
              <button className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900">Login</button>
              <Link to="/register" className="text-sm text-blue-600 hover:underline">Need an account? Register</Link>
            </div>
            {message && (
              <div className="form-group mt-2">
                <div className="text-red-500 text-sm">{message}</div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;