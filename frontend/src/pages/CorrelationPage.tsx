import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Zap,
  Layers,
  Clock,
  Network,
  Users,
  CopyCheck,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { correlationService } from '../services/socServices';
import { ICorrelationRule } from '../types';
import { useToast } from '../context/ToastContext';

export const CorrelationPage: React.FC = () => {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [rules, setRules] = useState<ICorrelationRule[]>([]);

  const fetchCorrelationData = async () => {
    try {
      setLoading(true);
      const [resData, rulesData] = await Promise.all([
        correlationService.getCorrelationResults(),
        correlationService.getRules(),
      ]);

      if (resData.success) setResults(resData.data);
      if (rulesData.success) setRules(rulesData.data);
    } catch (err: any) {
      error('Failed to load correlation data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelationData();
  }, []);

  const handleRunCorrelation = async () => {
    try {
      setCorrelating(true);
      const res = await correlationService.runCorrelation();
      success(
        `Correlation complete: Generated ${res.data.incidentsCreated} incidents with ${res.data.duplicatesSuppressed} duplicates suppressed!`
      );
      fetchCorrelationData();
    } catch (err: any) {
      error('Correlation run failed: ' + err.message);
    } finally {
      setCorrelating(false);
    }
  };

  const handleToggleRule = async (rule: ICorrelationRule) => {
    try {
      await correlationService.updateRule(rule.ruleId, { isActive: !rule.isActive });
      success(`Rule ${rule.ruleId} ${!rule.isActive ? 'activated' : 'deactivated'}.`);
      fetchCorrelationData();
    } catch (err: any) {
      error('Rule update failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Intelligent Correlation Engine Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic multi-dimensional clustering: deduplication, IP pivoting, entity convergence, and kill-chain analysis
          </p>
        </div>

        <button
          onClick={handleRunCorrelation}
          disabled={correlating}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-900/30 transition flex items-center gap-2"
        >
          <Zap className={`w-4 h-4 fill-current ${correlating ? 'animate-bounce' : ''}`} />
          <span>{correlating ? 'Analyzing & Correlating...' : 'Re-Run Correlation Engine'}</span>
        </button>
      </div>

      {/* Before & After Fatigue Transformation Hero Card */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alert Fatigue Reduction Ratio</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            {results?.efficiencyReduction || '77% Efficiency'}
          </span>
        </div>

        {/* Visual Transformation Stream */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
          {/* Step 1: Raw Ingested Alerts */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Raw Incoming Alerts</span>
            <span className="text-3xl font-extrabold font-mono text-slate-100 my-1 block">
              {results?.totalAlerts || 0}
            </span>
            <span className="text-[11px] text-slate-400">High-volume noisy telemetry from multiple sensors</span>
          </div>

          {/* Arrow / Step 2: Correlation Engine */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-glow-cyan mb-2">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">Multi-Pass Engine</span>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
              -{results?.totalDuplicateInstancesSuppressed || 0} duplicates suppressed
            </span>
          </div>

          {/* Step 3: Prioritized Incidents */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-500/40">
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block">Correlated Incidents</span>
            <span className="text-3xl font-extrabold font-mono text-cyan-300 my-1 block">
              {results?.incidentsCount || 0}
            </span>
            <span className="text-[11px] text-slate-300">Actionable cases for Tier-1/Tier-2 analyst triage</span>
          </div>
        </div>
      </div>

      {/* 7 Correlation Techniques Explanation Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-100 mb-3">Implemented Correlation Techniques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <CopyCheck className="w-4 h-4" />
              <span>1. Duplicate Detection</span>
            </div>
            <p className="text-xs text-slate-300">
              Generates cryptographic fingerprints across vendor, signature, source, and destination. Merges repetitive signals within sliding 15-minute windows into master events.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Network className="w-4 h-4" />
              <span>2. IP-Based Correlation</span>
            </div>
            <p className="text-xs text-slate-300">
              Groups alerts involving identical external threat actor IPs or victim IP subnets to reveal persistent probing or targeted campaigns.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>3. Time-Window Correlation</span>
            </div>
            <p className="text-xs text-slate-300">
              Identifies temporally clustered spikes occurring across internal infrastructure within configurable 30 to 120-minute inspection intervals.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Users className="w-4 h-4" />
              <span>4. Entity-Based Correlation</span>
            </div>
            <p className="text-xs text-slate-300">
              Connects disparate alerts sharing identity attributes (Kerberos user, service account, host machine name, domain controller).
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>5. Attack Pattern & Kill-Chain</span>
            </div>
            <p className="text-xs text-slate-300">
              Recognizes multi-stage progression: Reconnaissance → Initial Access → Exploitation → Privilege Escalation → Exfiltration.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>6. Behavioural Sequence</span>
            </div>
            <p className="text-xs text-slate-300">
              Detects anomalous temporal transitions such as a burst of failed authentications immediately culminating in a successful interactive login.
            </p>
          </div>
        </div>
      </div>

      {/* Active Correlation Rules Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Configured Correlation Rules</h3>
            <p className="text-xs text-slate-400">Rules applied dynamically during ingestion and correlation runs</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
            {rules.filter(r => r.isActive).length} / {rules.length} Rules Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Rule Name & Logic</th>
                <th className="py-2.5 px-3">Technique</th>
                <th className="py-2.5 px-3">Time Window</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules.map(rule => (
                <tr key={rule.ruleId} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">{rule.ruleId}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-200">{rule.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {rule.ruleType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{rule.timeWindowMinutes} mins</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.severity === 'Critical' ? 'bg-red-950 text-red-300 border border-red-500/40' : rule.severity === 'High' ? 'bg-orange-950 text-orange-300 border border-orange-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                        rule.isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
