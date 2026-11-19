import { IMitreTechnique, IAlert } from '../../types';

interface MitreDefinition {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  keywords: string[];
}

const mitreCatalog: MitreDefinition[] = [
  {
    tactic: 'Reconnaissance',
    techniqueId: 'T1595',
    techniqueName: 'Active Scanning',
    keywords: ['port scan', 'ip scan', 'nmap', 'reconnaissance', 'syn flood', 'probing', 'sweep'],
  },
  {
    tactic: 'Initial Access',
    techniqueId: 'T1190',
    techniqueName: 'Exploit Public-Facing Application',
    keywords: ['sqli', 'sql injection', 'xss', 'rce', 'web exploit', 'log4j', 'waf block', 'path traversal'],
  },
  {
    tactic: 'Credential Access',
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    keywords: ['failed login', 'multiple failed', 'brute force', 'password spraying', 'credential stuffing', 'auth failure'],
  },
  {
    tactic: 'Persistence',
    techniqueId: 'T1078',
    techniqueName: 'Valid Accounts',
    keywords: ['successful login', 'logon success', 'interactive login', 'account used', 'vpn access', 'after hours login'],
  },
  {
    tactic: 'Privilege Escalation',
    techniqueId: 'T1068',
    techniqueName: 'Exploitation for Privilege Escalation',
    keywords: ['privilege escalation', 'sudo', 'root elevation', 'uac bypass', 'admin rights', 'mimikatz', 'sam dump'],
  },
  {
    tactic: 'Defense Evasion',
    techniqueId: 'T1070',
    techniqueName: 'Indicator Removal on Host',
    keywords: ['log cleared', 'eventlog cleared', 'antivirus disabled', 'edr evasion', 'defense evasion', 'tampering'],
  },
  {
    tactic: 'Execution',
    techniqueId: 'T1059',
    techniqueName: 'Command and Scripting Interpreter',
    keywords: ['powershell', 'cmd.exe', 'bash', 'script execution', 'suspicious process', 'wmic', 'rundll32'],
  },
  {
    tactic: 'Lateral Movement',
    techniqueId: 'T1021',
    techniqueName: 'Remote Services',
    keywords: ['lateral movement', 'smb', 'rdp', 'psexec', 'ssh brute', 'internal connection', 'pass the hash'],
  },
  {
    tactic: 'Command and Control',
    techniqueId: 'T1071',
    techniqueName: 'Application Layer Protocol',
    keywords: ['c2', 'beacon', 'cobalt strike', 'command and control', 'dns tunnel', 'suspicious outbound', 'tor traffic'],
  },
  {
    tactic: 'Exfiltration',
    techniqueId: 'T1048',
    techniqueName: 'Exfiltration Over Alternative Protocol',
    keywords: ['data exfiltration', 'large upload', 'bulk export', 'sensitive data', 'cloud upload', 'ftp exfiltration', 'database dump'],
  },
  {
    tactic: 'Impact',
    techniqueId: 'T1486',
    techniqueName: 'Data Encrypted for Impact',
    keywords: ['ransomware', 'mass file rename', 'shadow copies deleted', 'vssadmin', 'encryption key', 'ransom note'],
  },
];

export function mapAlertsToMitre(alerts: IAlert[]): IMitreTechnique[] {
  const matched = new Map<string, IMitreTechnique>();

  for (const alert of alerts) {
    const text = `${alert.eventType} ${alert.description} ${alert.eventCategory} ${alert.rawLog || ''}`.toLowerCase();

    for (const def of mitreCatalog) {
      if (def.keywords.some(kw => text.includes(kw))) {
        if (!matched.has(def.techniqueId)) {
          matched.set(def.techniqueId, {
            tactic: def.tactic,
            techniqueId: def.techniqueId,
            techniqueName: def.techniqueName,
            matchedEvidence: `Triggered by ${alert.eventType} on [${alert.alertId}]`,
          });
        }
      }
    }
  }

  // If no specific match, assign default
  if (matched.size === 0) {
    matched.set('T1082', {
      tactic: 'Discovery',
      techniqueId: 'T1082',
      techniqueName: 'System Information Discovery',
      matchedEvidence: 'General telemetry and anomaly detection',
    });
  }

  return Array.from(matched.values());
}
