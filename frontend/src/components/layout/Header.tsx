import React, { useState } from 'react';
import { Radio, RefreshCw, Zap, Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { demoService, alertService, correlationService } from '../../services/socServices';

export const Header: React.FC<{ title?: string }> = ({ title = 'Security Operations Center' }) => {
  const { isConnected } = useSocket();
  const { success, error, info } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCorrelating, setIsCorrelating] = useState(false);

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      const res = await demoService.resetDemo();
      success(res.message || 'Demo reset successfully with 100+ alerts!');
      window.location.reload();
    } catch (err: any) {
      error('Failed to reset demo: ' + (err.message || 'error'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleSimulateAlert = async () => {
    try {
      setIsSimulating(true);
      const res = await alertService.simulateAlerts(1);
      info(`Simulated: ${res.data[0]?.eventType} (${res.data[0]?.sourceIp})`);
    } catch (err: any) {
      error('Simulation failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunCorrelation = async () => {
    try {
      setIsCorrelating(true);
      const res = await correlationService.runCorrelation();
      success(`Correlation finished: Created ${res.data.incidentsCreated} incidents with ${res.data.duplicatesSuppressed} duplicates suppressed!`);
    } catch (err: any) {
      error('Correlation run failed: ' + err.message);
    } finally {
      setIsCorrelating(false);
    }
  };

  return (
    <header className="h-16 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h1>
        <div className="h-4 w-px bg-slate-800 hidden md:block" />
        <div className="hidden md:flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-red-400 opacity-75'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </span>
          <span className="text-xs font-mono text-slate-400">
            {isConnected ? 'Telemetry Stream LIVE' : 'Connecting to SIEM...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulate Alert Button */}
        <button
          onClick={handleSimulateAlert}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition shadow-sm"
          title="Simulate random incoming security event"
        >
          <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Simulate Alert</span>
        </button>

        {/* Run Correlation Button */}
        <button
          onClick={handleRunCorrelation}
          disabled={isCorrelating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-900/30 transition"
          title="Trigger full alert correlation engine"
        >
          <Zap className={`w-3.5 h-3.5 ${isCorrelating ? 'animate-bounce' : ''}`} />
          <span>Run Correlation</span>
        </button>

        {/* 1-Click Demo Seed Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 transition shadow-sm"
          title="One-click reload full 100+ alert hackathon demonstration dataset"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Seed 100+ Demo</span>
        </button>
      </div>
    </header>
  );
};
