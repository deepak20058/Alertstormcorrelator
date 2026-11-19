import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const { error } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err: any) {
      error(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Password Reset</h1>
          <p className="text-xs text-slate-400">SOC Access Recovery Simulation</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered SOC user email address. We'll generate a verification token.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@alertstorm.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? 'Processing...' : 'Send Reset Instructions'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition"
              >
                Back to Login
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 text-center">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
