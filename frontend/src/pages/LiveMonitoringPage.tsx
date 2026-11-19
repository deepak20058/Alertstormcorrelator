import React, { useState } from 'react';
import {
  Radio,
  Pause,
  Play,
  Trash2,
  Zap,
  ShieldAlert,
  Flame,
  Terminal,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { alertService } from '../services/socServices';
import { SeverityBadge } from '../components/common/Badges';
import { useToast } from '../context/ToastContext';

export const LiveMonitoringPage: React.FC = () => {
  const { liveAlerts, isConnected, isPaused, togglePause, clearLiveStream } = useSocket();
  const { success, error } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateAttack = async (type: string) => {
    try {
      setIsSimulating(true);
      let override: any = {};
      if (type === 'brute') {
        override = {
          eventType: 'SSH Brute Force Attack Sequence',
          sourceSystem: 'Suricata Network IDS',
          sourceIp: '185.220.101.5',
          severity: 'High',
          eventCategory: 'Authentication',
        };
      } else if (type === 'apt') {
        override = {
          eventType: 'APT Lateral Movement Execution',
          sourceSystem: 'CrowdStrike Falcon EDR',
          sourceIp: '198.51.100.42',
          destinationIp: '10.0.1.50',
          severity: 'Critical',
          eventCategory: 'Lateral Movement',
        };
      } else if (type === 'ransom') {
        override = {
          eventType: 'Ransomware Mass File Encryption Anomaly',
          sourceSystem: 'Splunk SIEM',
          hostname: 'WS-FINANCE-04',
          severity: 'Critical',
          eventCategory: 'Impact',
        };
      }

      await alertService.simulateAlerts(3, override);
      success(`Simulated ${type.toUpperCase()} attack burst! Telemetry streamed into live buffer.`);
    } catch (err: any) {
      error('Simulation failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">Real-Time Security Event Stream</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live bi-directional WebSocket telemetry stream with instant correlation triggers
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isPaused
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          <button
            onClick={clearLiveStream}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Buffer</span>
          </button>
        </div>
      </div>

      {/* Simulator Quick Fire Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Inject Simulated Attack Scenario</span>
            <p className="text-[11px] text-slate-400">Trigger multi-event signals to test live correlation reaction</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulateAttack('brute')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Brute Force Wave</span>
          </button>
          <button
            onClick={() => handleSimulateAttack('apt')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/30 transition flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>APT Lateral Movement</span>
          </button>
          <button
            onClick={() => handleSimulateAttack('ransom')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ransomware Staging</span>
          </button>
        </div>
      </div>

      {/* Live Stream Terminal Box */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs shadow-2xl">
        <div className="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800 text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-200 font-bold">soc-stream://active-feed</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span>{isConnected ? 'STREAMING' : 'DISCONNECTED'}</span>
            </span>
            <span>{liveAlerts.length} events buffered</span>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[580px] overflow-y-auto bg-slate-950/80">
          {liveAlerts.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-sans space-y-2">
              <Radio className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p className="text-sm">Real-time socket listening. Awaiting incoming alerts...</p>
              <p className="text-xs text-slate-600">Click any scenario above to inject live events</p>
            </div>
          ) : (
            liveAlerts.map((alert, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-2"
              >
                <div className="flex items-start md:items-center gap-3">
                  <span className="text-cyan-400 font-bold shrink-0">{alert.alertId}</span>
                  <SeverityBadge severity={alert.severity} />
                  <div>
                    <span className="text-slate-100 font-sans font-semibold">{alert.eventType}</span>
                    <span className="text-slate-500 text-[11px] block md:inline md:ml-2">
                      [{alert.sourceSystem}]
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
                  <span>
                    {alert.sourceIp} → {alert.destinationIp}
                  </span>
                  {alert.hostname && <span className="text-amber-400/80">{alert.hostname}</span>}
                  <span className="text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
