import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  Flame,
  AlertTriangle,
  CopyCheck,
  Clock,
  Cpu,
  ArrowRight,
  Server,
  Activity,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { AlertsTrendChart, PriorityBarChart, ThreatCategoryPieChart } from '../components/dashboard/DashboardCharts';
import { SeverityBadge, PriorityBadge, StatusBadge, RiskScoreBar } from '../components/common/Badges';
import { analyticsService, incidentService } from '../services/socServices';
import { IIncident } from '../types';
import { useSocket } from '../context/SocketContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { liveAlerts } = useSocket();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<IIncident[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [ovRes, trRes, distRes, incRes] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getTrends(),
          analyticsService.getDistribution(),
          incidentService.getIncidents({ limit: 6 }),
        ]);

        if (ovRes.success) setOverview(ovRes.data);
        if (trRes.success) setTrends(trRes.data);
        if (distRes.success) setDistribution(distRes.data);
        if (incRes.success) setRecentIncidents(incRes.data);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-mono text-cyan-400">Loading SOC Telemetry Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Correlation Efficiency Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-glass">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Correlation Pipeline Active</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {overview?.correlationEfficiency || '77% Alert Reduction'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Reduced <span className="text-white font-semibold">{overview?.totalAlerts || 0}</span> raw telemetry events into{' '}
              <span className="text-cyan-400 font-bold">{overview?.totalIncidents || 0}</span> prioritized actionable incidents, eliminating{' '}
              <span className="text-emerald-400 font-semibold">{overview?.duplicateAlertsEliminated || 0}</span> duplicate signals.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/correlation')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
        >
          <span>Inspect Correlation Graph</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Alerts"
          value={overview?.totalAlerts || 0}
          subtitle="Processed across 8 sensors"
          icon={Bell}
          variant="blue"
        />
        <StatCard
          title="Active Incidents"
          value={overview?.activeIncidents || 0}
          subtitle="Pending analyst triage"
          icon={ShieldAlert}
          variant="cyan"
          badge="Live"
        />
        <StatCard
          title="Critical Alerts"
          value={overview?.criticalAlerts || 0}
          subtitle="Severity Level 5"
          icon={Flame}
          variant="red"
        />
        <StatCard
          title="Critical Incidents"
          value={overview?.criticalIncidents || 0}
          subtitle="Score >= 90/100"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Duplicates Eliminated"
          value={overview?.duplicateAlertsEliminated || 0}
          subtitle="Fingerprint suppression"
          icon={CopyCheck}
          variant="emerald"
        />
        <StatCard
          title="Avg Triage Time"
          value={overview?.averageResponseTime || '12.4m'}
          subtitle="SOC Response velocity"
          icon={Clock}
          variant="purple"
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Alert Volume & Critical Telemetry Over Time</h3>
              <p className="text-xs text-slate-400">Chronological telemetry density across ingestion windows</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              30m Intervals
            </span>
          </div>
          <AlertsTrendChart data={trends} />
        </div>

        {/* Priority Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Incident Priority Distribution</h3>
              <p className="text-xs text-slate-400">Risk-weighted incident triage queue</p>
            </div>
          </div>
          <PriorityBarChart data={distribution?.incidentsByPriority || []} />
        </div>
      </div>

      {/* Secondary Row: Attack Categories, Top IPs, and Top Targeted Hosts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Threat Category Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 mb-1">Threat Category Breakdown</h3>
          <p className="text-xs text-slate-400 mb-2">Classified attack mechanisms</p>
          <ThreatCategoryPieChart data={distribution?.threatCategoryDistribution || []} />
        </div>

        {/* Top Attacking Source IPs */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200">Top Suspicious Attack Origins</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Alert Count</span>
            </div>
            <div className="space-y-2.5">
              {(distribution?.topAttackingIps || []).slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-cyan-300">{item.ip}</span>
                    {idx === 0 && <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.2 rounded border border-red-500/30">C2 / APT</span>}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">{item.count} alerts</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/threat-intel')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-slate-800"
          >
            <span>View Full Threat Intelligence Feed</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Targeted Assets */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200">Top Targeted Internal Hosts</h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Asset Tier</span>
            </div>
            <div className="space-y-2.5">
              {(distribution?.topTargetedHosts || []).slice(0, 5).map((item: any, idx: number) => {
                const isDC = item.hostname.toLowerCase().includes('dc');
                const isProd = item.hostname.toLowerCase().includes('prod') || item.hostname.toLowerCase().includes('sql');
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 truncate">
                      <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-mono text-slate-200 truncate">{item.hostname}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDC ? 'bg-red-950 text-red-300 border border-red-500/40' : isProd ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-blue-950 text-blue-300 border border-blue-500/40'}`}>
                      {isDC ? 'Tier-0 DC' : isProd ? 'Tier-1 Prod' : 'Workstation'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-slate-800"
          >
            <span>Manage Incident Queue</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Security Incidents Table & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Prioritised Security Incidents</h3>
              <p className="text-xs text-slate-400">Generated by correlation engine from aggregated signals</p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Incident ID</th>
                  <th className="py-2.5 px-3">Threat Title & Target</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Correlated Alerts</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentIncidents.map(inc => (
                  <tr
                    key={inc.incidentId}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                    onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 group-hover:underline">
                      {inc.incidentId}
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="font-semibold text-slate-200 truncate">{inc.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{inc.category}</p>
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <RiskScoreBar score={inc.riskScore} />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {inc.alertCount} alerts
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
                        Investigate <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alert Activity Mini-Feed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">Live Ingestion Feed</h3>
              </div>
              <button
                onClick={() => navigate('/monitoring')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Full Console
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Streaming real-time telemetry from connected agents</p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
              {liveAlerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                  Awaiting live socket events. Click "Simulate Alert" in header to test.
                </div>
              ) : (
                liveAlerts.slice(0, 7).map((alert, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-cyan-400 font-semibold">{alert.alertId}</span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="text-slate-200 text-xs truncate">{alert.eventType}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {alert.sourceIp} → {alert.destinationIp} ({alert.sourceSystem})
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Buffer size: {liveAlerts.length} events</span>
            <span className="text-emerald-400 font-medium">Socket IO 4.7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
