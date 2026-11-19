import React from 'react';
import { AlertSeverity, IncidentPriority, IncidentStatus } from '../../types';

export const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'Critical':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-500/40 shadow-sm shadow-red-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse" />
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/80 text-orange-300 border border-orange-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5" />
          Low
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Info
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: IncidentPriority }> = ({ priority }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-950/90 text-red-200 border border-red-500/60 shadow-glow-red">
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-950/90 text-orange-200 border border-orange-500/60 shadow-glow-amber">
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-950/90 text-amber-200 border border-amber-500/60">
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-950/90 text-blue-200 border border-blue-500/60">
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  switch (status) {
    case 'New':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
          New
        </span>
      );
    case 'Investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
          Investigating
        </span>
      );
    case 'Contained':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/80 text-purple-300 border border-purple-500/40">
          Contained
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
          Resolved
        </span>
      );
    case 'False Positive':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          False Positive
        </span>
      );
  }
};

export const RiskScoreBar: React.FC<{ score: number; showNumber?: boolean }> = ({ score, showNumber = true }) => {
  let color = 'bg-cyan-500';
  let textColor = 'text-cyan-400';
  if (score >= 90) {
    color = 'bg-red-500';
    textColor = 'text-red-400';
  } else if (score >= 70) {
    color = 'bg-orange-500';
    textColor = 'text-orange-400';
  } else if (score >= 40) {
    color = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      {showNumber && <span className={`text-xs font-mono font-bold ${textColor}`}>{score}/100</span>}
    </div>
  );
};
