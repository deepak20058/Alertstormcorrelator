import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'cyan' | 'purple' | 'red' | 'amber' | 'emerald';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
}) => {
  const colorMap = {
    blue: {
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'shadow-glow-blue',
    },
    cyan: {
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-glow-cyan',
    },
    purple: {
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-glow-purple',
    },
    red: {
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/10 text-red-400',
      glow: 'shadow-glow-red',
    },
    amber: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-glow-amber',
    },
    emerald: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-sm',
    },
  };

  const style = colorMap[variant];

  return (
    <div className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${style.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight">{value}</h3>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border border-white/5 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
