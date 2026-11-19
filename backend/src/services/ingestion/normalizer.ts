import crypto from 'crypto';
import { z } from 'zod';
import { IAlert, AlertSeverity } from '../../types';

export const AlertInputSchema = z.object({
  alertId: z.string().optional(),
  timestamp: z.union([z.string(), z.date()]).optional(),
  sourceSystem: z.string().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  sourceIp: z.string().optional(),
  destinationIp: z.string().optional(),
  username: z.string().optional(),
  hostname: z.string().optional(),
  severity: z.string().optional(),
  description: z.string().optional(),
  protocol: z.string().optional(),
  port: z.union([z.number(), z.string()]).optional(),
  eventCategory: z.string().optional(),
  rawLog: z.string().optional(),
});

export function generateFingerprint(alert: {
  sourceSystem: string;
  eventType: string;
  sourceIp: string;
  destinationIp: string;
  username: string;
  port: number;
  eventCategory: string;
}): string {
  const payload = [
    alert.sourceSystem.trim().toLowerCase(),
    alert.eventType.trim().toLowerCase(),
    alert.sourceIp.trim(),
    alert.destinationIp.trim(),
    alert.username.trim().toLowerCase(),
    alert.port,
    alert.eventCategory.trim().toLowerCase(),
  ].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
}

export function normalizeSeverity(val?: string): AlertSeverity {
  if (!val) return 'Medium';
  const s = val.toString().trim().toLowerCase();
  if (s.includes('crit') || s === '5' || s === 'emergency' || s === 'fatal') return 'Critical';
  if (s.includes('high') || s === '4' || s === 'error') return 'High';
  if (s.includes('med') || s === '3' || s === 'warn' || s === 'warning') return 'Medium';
  if (s.includes('low') || s === '2') return 'Low';
  if (s.includes('info') || s === '1' || s === 'debug') return 'Info';
  return 'Medium';
}

export function normalizeRawAlert(input: any, indexOffset = 0): IAlert {
  // Extract fields accommodating varying vendor naming conventions
  const alertId =
    input.alertId ||
    input.alert_id ||
    input.id ||
    input.Id ||
    `ALT-${Date.now().toString().slice(-6)}-${indexOffset.toString().padStart(3, '0')}`;

  let timestamp = new Date();
  const rawTime = input.timestamp || input.time || input.datetime || input.Timestamp || input['@timestamp'];
  if (rawTime) {
    const parsed = new Date(rawTime);
    if (!isNaN(parsed.getTime())) {
      timestamp = parsed;
    }
  }

  const sourceSystem =
    input.sourceSystem ||
    input.source_system ||
    input.source ||
    input.device_vendor ||
    input.vendor ||
    'Generic SIEM';

  const eventType =
    input.eventType ||
    input.event_type ||
    input.event ||
    input.name ||
    input.signature ||
    input.rule_name ||
    'Security Event';

  const sourceIp =
    input.sourceIp ||
    input.source_ip ||
    input.src_ip ||
    input.src ||
    input.client_ip ||
    input.SourceIp ||
    '10.0.0.1';

  const destinationIp =
    input.destinationIp ||
    input.destination_ip ||
    input.dest_ip ||
    input.dst_ip ||
    input.dst ||
    input.server_ip ||
    input.DestinationIp ||
    '10.0.0.2';

  const username =
    input.username ||
    input.user ||
    input.user_name ||
    input.account ||
    input.src_user ||
    input.target_user ||
    '';

  const hostname =
    input.hostname ||
    input.host ||
    input.computer_name ||
    input.device_name ||
    input.workstation ||
    '';

  const severity = normalizeSeverity(
    input.severity || input.level || input.priority || input.alert_severity
  );

  const description =
    input.description ||
    input.message ||
    input.msg ||
    input.details ||
    `${eventType} detected from ${sourceIp} to ${destinationIp}`;

  const protocol = (input.protocol || input.proto || 'TCP').toUpperCase();
  const port = parseInt(input.port || input.dst_port || input.destination_port || '0', 10) || 0;

  const eventCategory =
    input.eventCategory ||
    input.event_category ||
    input.category ||
    inferCategory(eventType, description);

  const rawLog = input.rawLog || input.raw_log || input.raw || JSON.stringify(input);

  const fingerprint = generateFingerprint({
    sourceSystem,
    eventType,
    sourceIp,
    destinationIp,
    username,
    port,
    eventCategory,
  });

  return {
    alertId: String(alertId),
    timestamp,
    sourceSystem: String(sourceSystem),
    eventType: String(eventType),
    sourceIp: String(sourceIp),
    destinationIp: String(destinationIp),
    username: String(username),
    hostname: String(hostname),
    severity,
    description: String(description),
    protocol: String(protocol),
    port,
    eventCategory: String(eventCategory),
    rawLog: String(rawLog),
    fingerprint,
    isDuplicate: false,
    duplicateCount: 0,
    correlatedIncidentId: null,
    status: 'New',
    createdAt: new Date(),
  };
}

function inferCategory(eventType: string, description: string): string {
  const combined = (eventType + ' ' + description).toLowerCase();
  if (combined.includes('login') || combined.includes('auth') || combined.includes('credential') || combined.includes('password') || combined.includes('brute')) {
    return 'Authentication';
  }
  if (combined.includes('malware') || combined.includes('trojan') || combined.includes('ransomware') || combined.includes('virus') || combined.includes('c2') || combined.includes('beacon')) {
    return 'Malware';
  }
  if (combined.includes('scan') || combined.includes('recon') || combined.includes('probe') || combined.includes('enum') || combined.includes('sweep')) {
    return 'Reconnaissance';
  }
  if (combined.includes('privilege') || combined.includes('escalat') || combined.includes('sudo') || combined.includes('admin') || combined.includes('uac')) {
    return 'Privilege Escalation';
  }
  if (combined.includes('exfiltrat') || combined.includes('leak') || combined.includes('data transfer') || combined.includes('upload') || combined.includes('stolen')) {
    return 'Exfiltration';
  }
  if (combined.includes('lateral') || combined.includes('smb') || combined.includes('rdp') || combined.includes('psexec') || combined.includes('wmi')) {
    return 'Lateral Movement';
  }
  if (combined.includes('firewall') || combined.includes('ddos') || combined.includes('flood') || combined.includes('traffic') || combined.includes('drop')) {
    return 'Network';
  }
  return 'Security Event';
}
