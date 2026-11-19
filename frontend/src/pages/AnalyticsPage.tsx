import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Activity,
  Layers,
  Cpu,
  PieChart as PieIcon,
} from 'lucide-react';
import { analyticsService } from '../services/socServices';
import { AlertsTrendChart, PriorityBarChart, ThreatCategoryPieChart } from '../components/dashboard/DashboardCharts';
import { useToast } from '../context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const { success } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [ovRes, trRes, distRes] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getTrends(),
          analyticsService.getDistribution(),
        ]);
        if (ovRes.success) setOverview(ovRes.data);
        if (trRes.success) setTrends(trRes.data);
        if (distRes.success) setDistribution(distRes.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">SOC Executive Analytics & Compliance Reports</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Performance metrics, deduplication efficiency, and incident triage velocity reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => analyticsService.exportCsv('alerts')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Alerts CSV</span>
          </button>
          <button
            onClick={() => analyticsService.exportCsv('incidents')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
            <span>Incidents CSV</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b border-slate-400 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-black">AlertStormCorrelator SOC Executive Briefing</h1>
        <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {/* High-Level Efficiency Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Raw Telemetry Volume</span>
          <span className="text-3xl font-extrabold font-mono text-white mt-1 block">{overview?.totalAlerts || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Total alerts ingested</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Suppressed Duplicates</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-1 block">{overview?.duplicateAlertsEliminated || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Sliding window deduplication</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Correlated Incidents</span>
          <span className="text-3xl font-extrabold font-mono text-cyan-400 mt-1 block">{overview?.totalIncidents || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Actionable incident investigations</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40 bg-cyan-950/20">
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider block">Correlation Efficiency</span>
          <span className="text-3xl font-extrabold font-mono text-cyan-300 mt-1 block">{overview?.correlationEfficiency || '77%'}</span>
          <span className="text-[11px] text-cyan-400 mt-1 block">Alert fatigue reduction</span>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Time-Series Telemetry & Anomaly Density</h3>
          <p className="text-xs text-slate-400 mb-4">Ingestion surges vs Critical triage threshold</p>
          <AlertsTrendChart data={trends} />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Incidents by Priority Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Risk scoring triage queue categorization</p>
          <PriorityBarChart data={distribution?.incidentsByPriority || []} />
        </div>
      </div>

      {/* Telemetry Sensor Source Distribution */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Telemetry Sensor Distribution Breakdown</h3>
        <p className="text-xs text-slate-400 mb-4">Alert volume by detection system</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(distribution?.alertsBySource || []).map((src: any) => (
            <div key={src.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-300 block truncate">{src.name}</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">{src.value}</span>
              <span className="text-[10px] text-slate-500">alerts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
