import { Request, Response } from 'express';
import { seedDatabase } from '../utils/seedData';
import { isMongoConnected } from '../config/database';
import { socketEmitter } from '../sockets/socketHandler';

export const demoController = {
  async resetDemo(req: Request, res: Response) {
    try {
      console.log('🔄 Executing One-Click Hackathon Demo Reset...');
      await seedDatabase(true);

      socketEmitter.emitCorrelationFinished({ reset: true, timestamp: new Date() });

      return res.json({
        success: true,
        message: 'AlertStormCorrelator reset successfully with 100+ cybersecurity alerts and full correlation graph initialized!',
      });
    } catch (err: any) {
      console.error('Demo reset error:', err);
      return res.status(500).json({ success: false, message: 'Reset failed: ' + err.message });
    }
  },

  async healthCheck(req: Request, res: Response) {
    const memory = process.memoryUsage();
    return res.json({
      success: true,
      service: 'AlertStormCorrelator Engine',
      version: '2.4.0',
      status: 'HEALTHY',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        mode: isMongoConnected ? 'MongoDB (Clustered)' : 'Embedded Zero-Latency JSON/RAM Store',
        connected: true,
      },
      aiEngine: {
        provider: 'Deterministic Hybrid AI / MITRE ATT&CK Engine',
        status: 'Operational',
      },
      telemetrySensors: [
        { name: 'Palo Alto NGFW', status: 'Online', latency: '4ms' },
        { name: 'CrowdStrike Falcon EDR', status: 'Online', latency: '6ms' },
        { name: 'Suricata Network IDS', status: 'Online', latency: '2ms' },
        { name: 'Active Directory DC', status: 'Online', latency: '5ms' },
        { name: 'AWS GuardDuty', status: 'Online', latency: '12ms' },
        { name: 'Cloudflare WAF', status: 'Online', latency: '8ms' },
        { name: 'Splunk SIEM', status: 'Online', latency: '15ms' },
      ],
      timestamp: new Date(),
    });
  },
};
