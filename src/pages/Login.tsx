import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FileText, Lock, User, KeyRound, ArrowRight } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If username and password is admin, navigate directly to dashboard page
    if (username.trim() === 'admin' && password === 'admin') {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          login(data.token, data.username || 'admin');
        } else {
          login('admin-demo-token-12345', 'admin');
        }
      } catch (err) {
        login('admin-demo-token-12345', 'admin');
      }
      navigate('/dashboard');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.username);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin');
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] w-full px-4 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-900 p-3 rounded-xl border border-indigo-800 mb-4 text-white">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
        </div>

        {/* Demo / Fake Login Credentials */}
        <div id="demo-login-info" className="mb-6 p-3.5 bg-indigo-50/90 border border-indigo-100 rounded-lg text-xs text-indigo-950">
          <div className="flex items-center justify-between font-semibold text-indigo-900 mb-2">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Demo / Fake Login Info
            </span>
            <button
              type="button"
              id="autofill-admin-btn"
              onClick={fillAdminCredentials}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 cursor-pointer transition flex items-center gap-1"
            >
              Fill Admin
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-between text-slate-600 font-mono bg-white/90 py-1.5 px-2.5 rounded border border-indigo-100/70">
            <div>Username: <span className="font-semibold text-slate-900">admin</span></div>
            <div className="text-slate-300">|</div>
            <div>Password: <span className="font-semibold text-slate-900">admin</span></div>
          </div>
          <p className="mt-1.5 text-[11px] text-indigo-700/80">
            Enter <strong className="font-medium text-indigo-950">admin</strong> for both username & password to navigate to the dashboard.
          </p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-md mb-4 text-sm border border-rose-100">{error}</div>}

        <form id="login-form" onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                className="pl-10 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
