import { IAlert, AlertSeverity } from '../../types';
import { normalizeRawAlert } from '../ingestion/normalizer';

const vendors = [
  'Palo Alto NGFW',
  'CrowdStrike Falcon EDR',
  'Suricata Network IDS',
  'Active Directory DC',
  'AWS GuardDuty',
  'Cloudflare WAF',
  'Splunk SIEM',
  'Checkpoint Firewall',
  'Microsoft Defender for Endpoint',
  'Cisco ASA',
];

const externalIps = [
  '185.220.101.5',
  '194.26.29.112',
  '45.33.32.156',
  '103.251.167.20',
  '91.240.118.172',
  '198.51.100.42',
  '203.0.113.88',
];

const internalIps = [
  '10.0.1.15',
  '10.0.1.50',
  '10.0.2.100',
  '192.168.1.10',
  '192.168.1.105',
  '172.16.0.4',
  '172.16.0.20',
];

const internalHosts = [
  'DC01.corp.internal',
  'WS-FINANCE-04',
  'SRV-APP-PROD01',
  'SRV-SQL-BACKUP',
  'WS-EXEC-LAPTOP',
  'K8S-WORKER-NODE03',
  'GATEWAY-VPN-EXT',
];

const targetUsers = [
  'admin',
  'd.chen@corp.internal',
  'svc_backup',
  'jsmith',
  'm.williams',
  'root',
  'deploy_bot',
];

interface ScenarioTemplate {
  eventType: string;
  category: string;
  severity: AlertSeverity;
  protocol: string;
  port: number;
  description: string;
}

const scenarioTemplates: ScenarioTemplate[] = [
  {
    eventType: 'SSH Brute Force Attempt',
    category: 'Authentication',
    severity: 'High',
    protocol: 'SSH',
    port: 22,
    description: 'Repeated authentication failures detected against SSH gateway (50 attempts / min)',
  },
  {
    eventType: 'Kerberos Pre-Authentication Failure',
    category: 'Authentication',
    severity: 'Medium',
    protocol: 'TCP',
    port: 88,
    description: 'Multiple bad password attempts for corporate domain user account',
  },
  {
    eventType: 'Logon Success After Multiple Failures',
    category: 'Authentication',
    severity: 'High',
    protocol: 'TCP',
    port: 445,
    description: 'Anomalous logon success recorded following 12 failed attempts from same origin IP',
  },
  {
    eventType: 'SYN Stealth Port Scan',
    category: 'Reconnaissance',
    severity: 'Medium',
    protocol: 'TCP',
    port: 443,
    description: 'Port sweep detected across 1,024 TCP ports on perimeter firewall',
  },
  {
    eventType: 'Suspicious PowerShell Encoded Command',
    category: 'Privilege Escalation',
    severity: 'Critical',
    protocol: 'TCP',
    port: 5985,
    description: 'PowerShell executing Base64 encoded payload with ExecutionPolicy Bypass on endpoint',
  },
  {
    eventType: 'Mimikatz LSASS Memory Dump',
    category: 'Credential Access',
    severity: 'Critical',
    protocol: 'TCP',
    port: 0,
    description: 'EDR detected unauthorized process opening handle to lsass.exe for credential dumping',
  },
  {
    eventType: 'Lateral Movement via PsExec',
    category: 'Lateral Movement',
    severity: 'High',
    protocol: 'SMB',
    port: 445,
    description: 'Service creation and remote process execution initiated targeting internal backup server',
  },
  {
    eventType: 'C2 Beaconing via DNS Tunneling',
    category: 'Malware',
    severity: 'Critical',
    protocol: 'DNS',
    port: 53,
    description: 'High frequency TXT record lookups with high entropy subdomains indicative of DNS C2 channel',
  },
  {
    eventType: 'Large Outbound Data Transfer',
    category: 'Exfiltration',
    severity: 'Critical',
    protocol: 'HTTPS',
    port: 443,
    description: 'Anomalous 8.4 GB egress connection established to unclassified external IP address',
  },
  {
    eventType: 'WAF SQL Injection Blocked',
    category: 'Initial Access',
    severity: 'Medium',
    protocol: 'HTTPS',
    port: 443,
    description: 'Cloudflare WAF blocked SQL union-based injection probe in HTTP GET query string',
  },
  {
    eventType: 'Shadow Copies Deleted via vssadmin',
    category: 'Impact',
    severity: 'Critical',
    protocol: 'TCP',
    port: 0,
    description: 'Ransomware precursor behavior: vssadmin.exe delete shadows /all /quiet executed',
  },
];

export class AlertSimulator {
  public static generateSimulatedAlert(customAttrs?: Partial<IAlert>): IAlert {
    const template = scenarioTemplates[Math.floor(Math.random() * scenarioTemplates.length)];
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const srcIp = externalIps[Math.floor(Math.random() * externalIps.length)];
    const dstIp = internalIps[Math.floor(Math.random() * internalIps.length)];
    const host = internalHosts[Math.floor(Math.random() * internalHosts.length)];
    const user = targetUsers[Math.floor(Math.random() * targetUsers.length)];

    const idSuffix = Math.floor(1000 + Math.random() * 9000);
    const raw = {
      alertId: `ALT-SIM-${Date.now().toString().slice(-5)}-${idSuffix}`,
      timestamp: new Date(),
      sourceSystem: vendor,
      eventType: template.eventType,
      sourceIp: srcIp,
      destinationIp: dstIp,
      username: user,
      hostname: host,
      severity: template.severity,
      description: template.description,
      protocol: template.protocol,
      port: template.port,
      eventCategory: template.category,
      rawLog: `TIMESTAMP="${new Date().toISOString()}" VENDOR="${vendor}" SRC="${srcIp}" DST="${dstIp}" USER="${user}" MSG="${template.description}"`,
      ...customAttrs,
    };

    return normalizeRawAlert(raw);
  }
}
