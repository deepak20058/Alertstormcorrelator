import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const { success, error } = useToast();

  const [username, setUsername] = useState('admin@alertstorm.io');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(username, password);
      success('Authentication verified. Welcome to AlertStorm SOC.');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    try {
      setLoading(true);
      await demoLogin(role);
      success(`1-Click Demo Login verified as ${role}.`);
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-8 h-8 text-slate-950 fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AlertStormCorrelator</h1>
          <p className="text-xs text-slate-400">AI-Powered Security Alert Correlation & Triage SOC</p>
        </div>

        {/* 1-Click Demo Quick Access Box */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Hackathon 1-Click Demo Login</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Select role to instantly log in with pre-configured SOC permissions and sample telemetry:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo('Administrator')}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('Security Analyst')}
              disabled={loading}
              className="py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Analyst Demo</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="admin@alertstorm.io"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-cyan-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-glow-cyan"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Security Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need an analyst account?{' '}
              <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
