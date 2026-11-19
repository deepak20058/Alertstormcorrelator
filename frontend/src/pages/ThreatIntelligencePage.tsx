import React, { useEffect, useState } from 'react';
import {
  Network,
  ShieldAlert,
  Globe,
  ExternalLink,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { threatIntelService } from '../services/socServices';
import { IThreatIndicator } from '../types';
import { useToast } from '../context/ToastContext';

export const ThreatIntelligencePage: React.FC = () => {
  const { success, error } = useToast();

  const [indicators, setIndicators] = useState<IThreatIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    indicator: '',
    type: 'IP' as 'IP' | 'DOMAIN' | 'HASH',
    reputation: 'Malicious' as 'Malicious' | 'Suspicious' | 'Neutral',
    threatScore: '90',
    threatCategory: 'APT Command & Control (C2)',
    associatedActors: 'APT29, Cozy Bear',
    country: 'US',
  });

  const fetchThreatData = async () => {
    try {
      setLoading(true);
      const res = await threatIntelService.getIndicators();
      if (res.success) {
        setIndicators(res.data);
      }
    } catch (err: any) {
      error('Failed to load threat intelligence: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, []);

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndicator.indicator.trim()) return;
    try {
      await threatIntelService.createIndicator({
        ...newIndicator,
        threatScore: parseInt(newIndicator.threatScore, 10),
        associatedActors: newIndicator.associatedActors.split(',').map(s => s.trim()),
      });
      success(`Added threat indicator ${newIndicator.indicator}`);
      setShowAddModal(false);
      setNewIndicator({
        indicator: '',
        type: 'IP',
        reputation: 'Malicious',
        threatScore: '90',
        threatCategory: 'APT Command & Control (C2)',
        associatedActors: '',
        country: 'US',
      });
      fetchThreatData();
    } catch (err: any) {
      error('Failed to add indicator: ' + err.message);
    }
  };

  const filtered = indicators.filter(
    i =>
      i.indicator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.threatCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.associatedActors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Network className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Threat Intelligence & IOC Catalog</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reputation indicators, adversary infrastructure, and correlated threat campaign actors
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom IOC</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indicator, threat actor, or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Indicators Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Indicator (IOC)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Threat Score</th>
                <th className="py-3 px-4">Reputation</th>
                <th className="py-3 px-4">Category & Campaigns</th>
                <th className="py-3 px-4">Associated Threat Actors</th>
                <th className="py-3 px-4">Origin & ASN</th>
                <th className="py-3 px-4 text-right">Matched Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading threat intelligence database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No threat indicators matched search filter.
                  </td>
                </tr>
              ) : (
                filtered.map(ind => (
                  <tr key={ind.indicator} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      {ind.indicator}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {ind.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={ind.threatScore >= 90 ? 'text-red-400' : ind.threatScore >= 70 ? 'text-orange-400' : 'text-amber-400'}>
                        {ind.threatScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ind.reputation === 'Malicious'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {ind.reputation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {ind.threatCategory}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ind.associatedActors.map(act => (
                          <span key={act} className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            {act}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {ind.country || 'GLOBAL'} ({ind.asn || 'AS-N/A'})
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                      {ind.matchedAlertCount || 0} hits
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IOC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Threat Intelligence Indicator</h3>
            <form onSubmit={handleCreateIndicator} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Indicator (IP, Domain, Hash) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 198.51.100.42"
                  value={newIndicator.indicator}
                  onChange={e => setNewIndicator({ ...newIndicator, indicator: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newIndicator.type}
                    onChange={e => setNewIndicator({ ...newIndicator, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="IP">IP Address</option>
                    <option value="DOMAIN">Domain Name</option>
                    <option value="HASH">File Hash (SHA256)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Threat Score (0-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newIndicator.threatScore}
                    onChange={e => setNewIndicator({ ...newIndicator, threatScore: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Threat Category</label>
                <input
                  type="text"
                  value={newIndicator.threatCategory}
                  onChange={e => setNewIndicator({ ...newIndicator, threatCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Associated Actors (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. APT29, Cobalt Strike"
                  value={newIndicator.associatedActors}
                  onChange={e => setNewIndicator({ ...newIndicator, associatedActors: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-sm"
                >
                  Save Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
