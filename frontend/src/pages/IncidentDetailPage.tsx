import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Brain,
  Crosshair,
  Clock,
  Layers,
  Terminal,
  FileText,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { incidentService } from '../services/socServices';
import { IIncident, IAlert, IncidentStatus } from '../types';
import { PriorityBadge, StatusBadge, SeverityBadge, RiskScoreBar } from '../components/common/Badges';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [incident, setIncident] = useState<IIncident | null>(null);
  const [correlatedAlerts, setCorrelatedAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'investigation' | 'timeline' | 'alerts' | 'notes'>('investigation');
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchIncidentDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [incRes, alertsRes] = await Promise.all([
        incidentService.getIncidentById(id),
        incidentService.getCorrelatedAlerts(id),
      ]);

      if (incRes.success) setIncident(incRes.data);
      if (alertsRes.success) setCorrelatedAlerts(alertsRes.data);
    } catch (err: any) {
      error('Failed to load incident: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchIncidentDetails();
  }, [fetchIncidentDetails]);

  const handleStatusUpdate = async (newStatus: IncidentStatus) => {
    if (!incident) return;
    try {
      await incidentService.updateIncident(incident.incidentId, { status: newStatus });
      success(`Incident status updated to ${newStatus}`);
      fetchIncidentDetails();
    } catch (err: any) {
      error('Status update failed: ' + err.message);
    }
  };

  const handleAssignToMe = async () => {
    if (!incident || !user) return;
    try {
      await incidentService.updateIncident(incident.incidentId, {
        assignedTo: {
          userId: user.id,
          name: user.name || user.username,
          email: user.email,
          role: user.role,
        },
        status: 'Investigating',
      });
      success(`Assigned to ${user.name || user.username}`);
      fetchIncidentDetails();
    } catch (err: any) {
      error('Assignment failed: ' + err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !incident) return;
    try {
      setSubmittingNote(true);
      await incidentService.addNote(incident.incidentId, newNote.trim());
      success('Investigation note recorded.');
      setNewNote('');
      fetchIncidentDetails();
    } catch (err: any) {
      error('Failed to add note: ' + err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading && !incident) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-mono text-cyan-400">Loading Incident Investigation Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Incident not found.</p>
        <button
          onClick={() => navigate('/incidents')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-400 text-xs font-semibold"
        >
          Return to Incidents
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-extrabold text-cyan-400 text-lg">{incident.incidentId}</span>
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">{incident.title}</h2>
          </div>
        </div>

        {/* Quick Triage Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={incident.status}
              onChange={e => handleStatusUpdate(e.target.value as IncidentStatus)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>

          {!incident.assignedTo ? (
            <button
              onClick={handleAssignToMe}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign to Me</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{incident.assignedTo.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Incident Metadata & Risk Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Score Meter */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Composite Risk Score</p>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${incident.riskScore >= 90 ? 'text-red-400' : incident.riskScore >= 70 ? 'text-orange-400' : 'text-amber-400'}`}>
                {incident.riskScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
            <RiskScoreBar score={incident.riskScore} showNumber={false} />
          </div>
          <p className="text-[11px] text-slate-400">
            {incident.riskScore >= 90 ? 'Requires Immediate Tier-3 Containment' : 'High Priority Security Event'}
          </p>
        </div>

        {/* Correlated Entities */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Affected Entities</p>
          <div className="space-y-1.5 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Attacker IP(s): </span>
              <span className="text-cyan-400 font-semibold">{incident.entities.sourceIps.join(', ') || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Target Hosts: </span>
              <span className="text-slate-200">{incident.entities.hostnames.join(', ') || incident.entities.destIps.join(', ') || 'Internal Asset'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Accounts: </span>
              <span className="text-amber-300">{incident.entities.users.join(', ') || 'Service / Network Layer'}</span>
            </div>
          </div>
        </div>

        {/* Correlation Reason */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correlation Logic</p>
          <p className="text-xs text-slate-300 leading-relaxed">{incident.correlationReason}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {incident.correlationRulesMatched.map(r => (
              <span key={r} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* First & Last Seen */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detection Timeline</p>
          <div className="text-xs font-mono space-y-1">
            <p className="text-slate-400">
              First Seen: <span className="text-slate-200">{new Date(incident.firstSeen).toLocaleTimeString()}</span>
            </p>
            <p className="text-slate-400">
              Last Seen: <span className="text-slate-200">{new Date(incident.lastSeen).toLocaleTimeString()}</span>
            </p>
            <p className="text-slate-400">
              Correlated: <span className="text-cyan-400 font-bold">{incident.alertCount} events</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Verified Match ({incident.confidenceScore}%)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('investigation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'investigation'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI Investigation & MITRE</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'timeline'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attack Timeline ({incident.attackTimeline.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'alerts'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Correlated Telemetry ({correlatedAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'notes'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Analyst Notes ({incident.notes?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: AI Investigation Hub */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-950">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Incident Executive Summary</h3>
                  <p className="text-xs text-slate-400">Generated by {incident.aiInvestigation.modelUsed}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Explainable AI
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed mt-2">{incident.aiInvestigation.summary}</p>
          </div>

          {/* Probable Attack & Risk Assessment (Two Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Probable Attack Mechanism */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Crosshair className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-slate-100">Probable Attack Hypothesis & Tradecraft</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 font-mono">
                {incident.aiInvestigation.probableAttack}
              </p>
              <div className="mt-3 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300">
                <strong>Attacker Tradecraft Note:</strong> Clear distinction between raw observed events and AI hypothesis. Review raw logs to confirm hypothesis before containment actions.
              </div>
            </div>

            {/* Risk Assessment & Impact */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-bold text-slate-100">Risk Assessment & Potential Impact</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {incident.aiInvestigation.riskAssessment}
              </p>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Risk Scoring Breakdown</p>
                <div className="space-y-1.5">
                  {incident.riskFactors.map((rf, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/40 border border-slate-800/80">
                      <span className="text-slate-300">{rf.factor}</span>
                      <span className="font-mono font-bold text-cyan-400">+{rf.scoreImpact} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MITRE ATT&CK Mapping Grid */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-slate-100">MITRE ATT&CK Matrix Alignment</h4>
              </div>
              <span className="text-xs font-mono text-purple-400">Enterprise Matrix v14</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {incident.mitreMapping.map((tech, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">{tech.tactic}</span>
                    <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">
                      {tech.techniqueId}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100">{tech.techniqueName}</p>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{tech.matchedEvidence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations & Containment (Two Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investigation Checklist */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Recommended Investigation Steps</span>
              </h4>
              <ul className="space-y-2.5">
                {incident.aiInvestigation.recommendedSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Containment Actions */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Suggested Containment Actions</span>
                </h4>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  Advisory Only
                </span>
              </div>
              <ul className="space-y-2.5">
                {incident.aiInvestigation.suggestedContainment.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      !
                    </span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-slate-500 mt-3 italic">
                * Containment actions are advisory proposals generated by AI triage and must be manually verified and approved by the security analyst before implementation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Attack Timeline */}
      {activeTab === 'timeline' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Chronological Attack Timeline</h3>
              <p className="text-xs text-slate-400">Step-by-step kill-chain sequence reconstructed by the correlation engine</p>
            </div>
          </div>

          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {incident.attackTimeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                {/* Dot on line */}
                <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${item.severity === 'Critical' ? 'bg-red-500 shadow-glow-red' : item.severity === 'High' ? 'bg-orange-500' : 'bg-cyan-500'}`} />

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{item.alertId}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                        {item.stage}
                      </span>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-200">{item.eventType}</p>
                  <p className="text-xs text-slate-300 mt-1">{item.description}</p>

                  <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-4">
                    <span>Source: {item.sourceIp || 'N/A'}</span>
                    <span>Target: {item.destinationIp || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Correlated Alerts */}
      {activeTab === 'alerts' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Correlated Telemetry Records</h3>
              <p className="text-xs text-slate-400">All {correlatedAlerts.length} raw alerts clustered into this security incident</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Sensor / Source</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Source IP</th>
                  <th className="py-2.5 px-3">Destination IP</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {correlatedAlerts.map(a => (
                  <tr key={a.alertId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{a.alertId}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-slate-300">{a.sourceSystem}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{a.eventType}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{a.sourceIp}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{a.destinationIp}</td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={a.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Analyst Notes */}
      {activeTab === 'notes' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100">Investigation Notes & Case Audit</h3>
            <p className="text-xs text-slate-400">Chronological analyst commentary and containment decisions</p>
          </div>

          {/* New Note Form */}
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              placeholder="Record forensic observation, containment action, or analyst note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Note</span>
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            {!incident.notes || incident.notes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No investigation notes recorded yet.</p>
            ) : (
              incident.notes.map(note => (
                <div key={note.noteId} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{note.authorName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-medium">
                        {note.authorRole}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
