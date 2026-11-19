import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  UploadCloud,
  Cpu,
  Radio,
  Network,
  BarChart3,
  LogOut,
  Zap,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Alert Ingestion', path: '/ingestion', icon: UploadCloud },
    { name: 'Correlation Engine', path: '/correlation', icon: Cpu },
    { name: 'Live Monitoring', path: '/monitoring', icon: Radio },
    { name: 'Threat Intelligence', path: '/threat-intel', icon: Network },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#0b1329] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  AlertStorm
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  SOC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Correlation & Triage</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User & Role Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate max-w-[110px]">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || user?.username || 'Analyst'}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] text-slate-400 truncate">{user?.role || 'Security Analyst'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Role Switcher */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5">
          <button
            onClick={() => demoLogin('Administrator')}
            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'Administrator'
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => demoLogin('Security Analyst')}
            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium border text-center transition ${
              user?.role === 'Security Analyst'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Analyst
          </button>
        </div>
      </div>
    </aside>
  );
};
