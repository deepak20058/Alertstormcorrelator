import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  PlusCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { alertService } from '../services/socServices';
import { useToast } from '../context/ToastContext';
import { AlertSeverity } from '../types';

export const IngestionPage: React.FC = () => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'simulate' | 'api'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    eventType: '',
    sourceSystem: 'Palo Alto NGFW',
    sourceIp: '',
    destinationIp: '',
    username: '',
    hostname: '',
    severity: 'High' as AlertSeverity,
    description: '',
    protocol: 'TCP',
    port: '443',
    eventCategory: 'Authentication',
    rawLog: '',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Simulation State
  const [simCount, setSimCount] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      error('Please select a JSON or CSV file to upload.');
      return;
    }
    try {
      setIsUploading(true);
      const res = await alertService.uploadAlertsFile(selectedFile);
      setUploadResult(res);
      success(res.message);
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.eventType) {
      error('Event Type is required.');
      return;
    }
    try {
      setIsSubmittingManual(true);
      const res = await alertService.createAlert({
        ...manualForm,
        port: parseInt(manualForm.port || '0', 10),
      });
      success(`Alert ${res.data.alertId} ingested into correlation queue!`);
      setManualForm({
        eventType: '',
        sourceSystem: 'Palo Alto NGFW',
        sourceIp: '',
        destinationIp: '',
        username: '',
        hostname: '',
        severity: 'High',
        description: '',
        protocol: 'TCP',
        port: '443',
        eventCategory: 'Authentication',
        rawLog: '',
      });
    } catch (err: any) {
      error(err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleSimulateBurst = async () => {
    try {
      setIsSimulating(true);
      const res = await alertService.simulateAlerts(simCount);
      success(`Simulated & correlated ${simCount} security alerts!`);
    } catch (err: any) {
      error('Simulation failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Security Alert Ingestion Gateway</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Normalize raw alerts from multi-vendor security systems via File Upload, REST API, or Live Generation
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'upload'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>JSON / CSV File Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'manual'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Submission</span>
        </button>
        <button
          onClick={() => setActiveTab('simulate')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'simulate'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Live Alert Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
            activeTab === 'api'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>REST API Documentation</span>
        </button>
      </div>

      {/* TAB 1: FILE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Box (2 cols) */}
            <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100">Batch Alert Ingestion (.JSON / .CSV)</h3>
              <p className="text-xs text-slate-400">
                Upload raw telemetry logs. The normalization pipeline extracts timestamps, vendor identifiers, IP addresses, usernames, and creates sliding-window fingerprints.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center transition bg-slate-900/40">
                <input
                  type="file"
                  id="alertFileInput"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="alertFileInput" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-400 hover:underline">
                      {selectedFile ? selectedFile.name : 'Click to select file or drag and drop'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Supports JSON array of alert records or CSV format</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB selected` : 'No file chosen'}
                </span>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white shadow-md shadow-cyan-950 transition flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing & Normalizing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Ingest & Correlate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Upload Result Card */}
              {uploadResult && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{uploadResult.message}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Alerts Ingested</span>
                      <span className="text-cyan-400 font-bold">{uploadResult.ingestedCount}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Incidents Formed</span>
                      <span className="text-purple-400 font-bold">{uploadResult.correlation?.incidentsCreated}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Suppression Efficiency</span>
                      <span className="text-emerald-400 font-bold">{uploadResult.correlation?.efficiency}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Sample Files Download (1 col) */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-2">Sample Demonstration Datasets</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Download standard pre-generated benchmark files containing 100+ cybersecurity alerts across 10 realistic attack scenarios to test ingestion.
                </p>

                <div className="space-y-3">
                  <a
                    href="/sample-data/alerts_sample_100.json"
                    download="alerts_sample_100.json"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                          alerts_sample_100.json
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">102 alerts • JSON array</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  </a>

                  <a
                    href="/sample-data/alerts_sample_100.csv"
                    download="alerts_sample_100.csv"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                          alerts_sample_100.csv
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">102 alerts • CSV format</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 mt-4">
                <strong>Benchmark Coverage:</strong> Brute force, credential theft, Log4j RCE, Cobalt Strike C2, ransomware staging, and duplicate suppression.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL SUBMISSION */}
      {activeTab === 'manual' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 mb-1">Manual Alert Ingestion</h3>
          <p className="text-xs text-slate-400 mb-6">Submit custom security telemetry event directly into the pipeline</p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Type *</label>
                <input
                  type="text"
                  placeholder="e.g. Cobalt Strike Beaconing"
                  required
                  value={manualForm.eventType}
                  onChange={e => setManualForm({ ...manualForm, eventType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source Sensor System</label>
                <select
                  value={manualForm.sourceSystem}
                  onChange={e => setManualForm({ ...manualForm, sourceSystem: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Palo Alto NGFW">Palo Alto NGFW</option>
                  <option value="CrowdStrike Falcon EDR">CrowdStrike Falcon EDR</option>
                  <option value="Suricata Network IDS">Suricata Network IDS</option>
                  <option value="Active Directory DC">Active Directory DC</option>
                  <option value="AWS GuardDuty">AWS GuardDuty</option>
                  <option value="Cloudflare WAF">Cloudflare WAF</option>
                  <option value="Splunk SIEM">Splunk SIEM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
                <select
                  value={manualForm.severity}
                  onChange={e => setManualForm({ ...manualForm, severity: e.target.value as AlertSeverity })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Info">Info</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source IP</label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.42"
                  value={manualForm.sourceIp}
                  onChange={e => setManualForm({ ...manualForm, sourceIp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination IP</label>
                <input
                  type="text"
                  placeholder="e.g. 10.0.1.15"
                  value={manualForm.destinationIp}
                  onChange={e => setManualForm({ ...manualForm, destinationIp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. jsmith or svc_deploy"
                  value={manualForm.username}
                  onChange={e => setManualForm({ ...manualForm, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Hostname</label>
                <input
                  type="text"
                  placeholder="e.g. DC01.corp.internal"
                  value={manualForm.hostname}
                  onChange={e => setManualForm({ ...manualForm, hostname: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={manualForm.eventCategory}
                  onChange={e => setManualForm({ ...manualForm, eventCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Authentication">Authentication</option>
                  <option value="Privilege Escalation">Privilege Escalation</option>
                  <option value="Malware">Malware</option>
                  <option value="Exfiltration">Exfiltration</option>
                  <option value="Lateral Movement">Lateral Movement</option>
                  <option value="Reconnaissance">Reconnaissance</option>
                  <option value="Network">Network</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol</label>
                <input
                  type="text"
                  value={manualForm.protocol}
                  onChange={e => setManualForm({ ...manualForm, protocol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Port</label>
                <input
                  type="number"
                  value={manualForm.port}
                  onChange={e => setManualForm({ ...manualForm, port: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description</label>
              <textarea
                rows={2}
                placeholder="Observed attacker activity or signature description..."
                value={manualForm.description}
                onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingManual}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Alert to Ingestion Engine</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LIVE SIMULATOR */}
      {activeTab === 'simulate' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">Simulated Live Attack Traffic Generator</h3>
            <p className="text-xs text-slate-400">
              Generate realistic multi-sensor telemetry bursts to observe real-time correlation and incident generation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batch Simulation Count</label>
              <select
                value={simCount}
                onChange={e => setSimCount(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>1 Alert (Single event)</option>
                <option value={5}>5 Alerts (Mini burst)</option>
                <option value={15}>15 Alerts (Coordinated wave)</option>
                <option value={30}>30 Alerts (Heavy attack surge)</option>
              </select>
            </div>

            <button
              onClick={handleSimulateBurst}
              disabled={isSimulating}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              <Play className={`w-4 h-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Generate {simCount} Security Alerts Now</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: API DOCS */}
      {activeTab === 'api' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">REST API Alert Ingestion Endpoint</h3>
          <p className="text-xs text-slate-400">
            Automate telemetry forwarding from remote SIEMs, syslog daemons, and cloud security hooks.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
            <div className="text-cyan-400 font-bold">POST /api/alerts</div>
            <p className="text-slate-400 text-[11px]">Headers: Authorization: Bearer &lt;JWT_TOKEN&gt; | Content-Type: application/json</p>
            <pre className="text-slate-200 overflow-x-auto text-[11px] p-2 bg-slate-900 rounded">
{`{
  "eventType": "SSH Brute Force Attempt",
  "sourceSystem": "Suricata Network IDS",
  "sourceIp": "185.220.101.5",
  "destinationIp": "10.0.1.15",
  "username": "admin",
  "hostname": "DC01.corp.internal",
  "severity": "High",
  "description": "50 consecutive authentication rejections in 60 seconds",
  "protocol": "TCP",
  "port": 22,
  "eventCategory": "Authentication"
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
