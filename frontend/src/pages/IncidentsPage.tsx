import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  UserCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { incidentService, analyticsService } from '../services/socServices';
import { IIncident, IncidentPriority, IncidentStatus } from '../types';
import { PriorityBadge, StatusBadge, RiskScoreBar } from '../components/common/Badges';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await incidentService.getIncidents({
        page,
        limit: 20,
        priority: priorityFilter,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setIncidents(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      error('Failed to load incidents: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, priorityFilter, statusFilter, searchTerm, error]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleStatusChange = async (e: React.MouseEvent, incidentId: string, newStatus: IncidentStatus) => {
    e.stopPropagation();
    try {
      await incidentService.updateIncident(incidentId, { status: newStatus });
      success(`Updated incident ${incidentId} to ${newStatus}`);
      fetchIncidents();
    } catch (err: any) {
      error('Failed to update status: ' + err.message);
    }
  };

  const handleAssignToMe = async (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    try {
      await incidentService.updateIncident(incidentId, {
        assignedTo: {
          userId: user?.id,
          name: user?.name || user?.username || 'Security Analyst',
          email: user?.email || '',
          role: user?.role || 'Security Analyst',
        },
        status: 'Investigating',
      });
      success(`Incident ${incidentId} assigned to ${user?.name || user?.username}`);
      fetchIncidents();
    } catch (err: any) {
      error('Failed to assign incident: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Security Incident Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized security incidents generated from multi-source alert correlation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => analyticsService.exportCsv('incidents')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchIncidents}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh incident list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, title, or category..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title & Classification</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Correlated Signals</th>
                <th className="py-3 px-4">Assigned Analyst</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading incident registry...</span>
                    </div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No security incidents matched the selected filters.
                  </td>
                </tr>
              ) : (
                incidents.map(inc => (
                  <tr
                    key={inc.incidentId}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                    onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 group-hover:underline whitespace-nowrap">
                      {inc.incidentId}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {inc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400">{inc.category}</span>
                        {inc.confidenceScore && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                            {inc.confidenceScore}% match
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskScoreBar score={inc.riskScore} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                        {inc.alertCount} alerts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {inc.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-200 text-xs font-medium">{inc.assignedTo.name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={e => handleAssignToMe(e, inc.incidentId)}
                          className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition"
                        >
                          + Assign to me
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <select
                          value={inc.status}
                          onChange={e => handleStatusChange(e as any, inc.incidentId, e.target.value as IncidentStatus)}
                          className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="New">New</option>
                          <option value="Investigating">Investigating</option>
                          <option value="Contained">Contained</option>
                          <option value="Resolved">Resolved</option>
                          <option value="False Positive">False Positive</option>
                        </select>
                        <button
                          onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition"
                          title="Open deep-dive investigation"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {incidents.length} of {total} incidents
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition"
            >
              Previous
            </button>
            <span className="font-mono text-slate-300 font-bold">Page {page}</span>
            <button
              disabled={incidents.length < 20}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
