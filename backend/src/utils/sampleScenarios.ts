import { IAlert } from '../types';
import { normalizeRawAlert } from '../services/ingestion/normalizer';

export function getSampleAlertsDataset(): IAlert[] {
  const baseTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
  const alerts: any[] = [];
  let seq = 1000;

  const mkTime = (minutesOffset: number) => new Date(baseTime.getTime() + minutesOffset * 60 * 1000).toISOString();

  // SCENARIO 1: Coordinated Multi-Stage Attack (APT29 Profile from IP 198.51.100.42)
  // Stage A: Recon
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(5),
    sourceSystem: 'Suricata Network IDS',
    eventType: 'TCP SYN Stealth Port Sweep',
    sourceIp: '198.51.100.42',
    destinationIp: '10.0.1.15',
    username: '',
    hostname: 'FW-PERIMETER-01',
    severity: 'Medium',
    description: 'Port sweep detected across ports 21, 22, 80, 443, 445, 3389, 8080 from single remote host',
    protocol: 'TCP',
    port: 445,
    eventCategory: 'Reconnaissance',
  });
  // Stage B: WAF Exploit probe
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(12),
    sourceSystem: 'Cloudflare WAF',
    eventType: 'Remote Code Execution Attempt (Log4j CVE-2021-44228)',
    sourceIp: '198.51.100.42',
    destinationIp: '10.0.1.15',
    username: '',
    hostname: 'SRV-APP-PROD01',
    severity: 'High',
    description: 'JNDI LDAP lookup string identified in HTTP User-Agent header',
    protocol: 'HTTPS',
    port: 443,
    eventCategory: 'Initial Access',
  });
  // Stage C: Failed login attempt
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(20),
    sourceSystem: 'Active Directory DC',
    eventType: 'Kerberos Pre-Auth Failure',
    sourceIp: '198.51.100.42',
    destinationIp: '10.0.1.15',
    username: 'svc_deploy',
    hostname: 'DC01.corp.internal',
    severity: 'Medium',
    description: 'Pre-authentication failure for service account svc_deploy',
    protocol: 'TCP',
    port: 88,
    eventCategory: 'Authentication',
  });
  // Stage D: Successful compromised login
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(25),
    sourceSystem: 'Active Directory DC',
    eventType: 'Kerberos Authentication Ticket Granted',
    sourceIp: '198.51.100.42',
    destinationIp: '10.0.1.15',
    username: 'svc_deploy',
    hostname: 'SRV-APP-PROD01',
    severity: 'High',
    description: 'TGS requested for CIFS service with abnormal cryptographic suite from external IP',
    protocol: 'TCP',
    port: 88,
    eventCategory: 'Authentication',
  });
  // Stage E: Privilege Escalation
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(35),
    sourceSystem: 'CrowdStrike Falcon EDR',
    eventType: 'Privilege Escalation via Token Impersonation',
    sourceIp: '198.51.100.42',
    destinationIp: '10.0.1.15',
    username: 'svc_deploy',
    hostname: 'SRV-APP-PROD01',
    severity: 'Critical',
    description: 'Process cmd.exe duplicated SYSTEM primary token via SeAssignPrimaryTokenPrivilege',
    protocol: 'TCP',
    port: 0,
    eventCategory: 'Privilege Escalation',
  });
  // Stage F: Lateral Movement
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(45),
    sourceSystem: 'CrowdStrike Falcon EDR',
    eventType: 'Lateral Movement via PsExec Service Execution',
    sourceIp: '10.0.1.15',
    destinationIp: '10.0.1.50',
    username: 'SYSTEM',
    hostname: 'SRV-SQL-BACKUP',
    severity: 'Critical',
    description: 'Remote service PSEXESVC installed on database server from application tier',
    protocol: 'SMB',
    port: 445,
    eventCategory: 'Lateral Movement',
  });
  // Stage G: Data Exfiltration
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(60),
    sourceSystem: 'Palo Alto NGFW',
    eventType: 'High Volume Outbound Data Transfer to Untrusted Destination',
    sourceIp: '10.0.1.50',
    destinationIp: '198.51.100.42',
    username: 'SYSTEM',
    hostname: 'SRV-SQL-BACKUP',
    severity: 'Critical',
    description: 'Egress session transferred 4.8 GB encrypted binary stream over port 443 to external C2 host',
    protocol: 'HTTPS',
    port: 443,
    eventCategory: 'Exfiltration',
  });

  // SCENARIO 2: Brute Force & Credential Compromise (Attacker IP 185.220.101.5)
  for (let i = 0; i < 8; i++) {
    alerts.push({
      alertId: `ALT-${++seq}`,
      timestamp: mkTime(30 + i * 2),
      sourceSystem: 'Active Directory DC',
      eventType: 'User Account Failed Login Attempt',
      sourceIp: '185.220.101.5',
      destinationIp: '10.0.2.100',
      username: 'jsmith',
      hostname: 'DC01.corp.internal',
      severity: 'Medium',
      description: `Event 4625: Bad password attempt for account jsmith from remote IP 185.220.101.5 (Attempt ${i + 1}/8)`,
      protocol: 'TCP',
      port: 389,
      eventCategory: 'Authentication',
    });
  }
  // Followed by successful login
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(48),
    sourceSystem: 'Active Directory DC',
    eventType: 'User Account Logon Success',
    sourceIp: '185.220.101.5',
    destinationIp: '10.0.2.100',
    username: 'jsmith',
    hostname: 'DC01.corp.internal',
    severity: 'High',
    description: 'Event 4624: Successful remote interactive logon for jsmith immediately after burst of authentication failures',
    protocol: 'TCP',
    port: 389,
    eventCategory: 'Authentication',
  });
  // And sudden group addition
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(52),
    sourceSystem: 'Active Directory DC',
    eventType: 'Security Group Membership Alteration',
    sourceIp: '185.220.101.5',
    destinationIp: '10.0.2.100',
    username: 'jsmith',
    hostname: 'DC01.corp.internal',
    severity: 'Critical',
    description: 'Event 4728: Account jsmith added user jsmith to Domain Admins privileged security group',
    protocol: 'TCP',
    port: 389,
    eventCategory: 'Privilege Escalation',
  });

  // SCENARIO 3: Ransomware Staging on WS-FINANCE-04
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(70),
    sourceSystem: 'Microsoft Defender for Endpoint',
    eventType: 'Malicious Office Macro Execution',
    sourceIp: '192.168.1.105',
    destinationIp: '192.168.1.105',
    username: 'm.williams',
    hostname: 'WS-FINANCE-04',
    severity: 'High',
    description: 'EXCEL.EXE spawned PowerShell with hidden window flag and download string',
    protocol: 'TCP',
    port: 0,
    eventCategory: 'Malware',
  });
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(73),
    sourceSystem: 'CrowdStrike Falcon EDR',
    eventType: 'Volume Shadow Copies Deletion Attempt',
    sourceIp: '192.168.1.105',
    destinationIp: '192.168.1.105',
    username: 'm.williams',
    hostname: 'WS-FINANCE-04',
    severity: 'Critical',
    description: 'Command line detected: vssadmin.exe delete shadows /all /quiet executed by suspicious child process',
    protocol: 'TCP',
    port: 0,
    eventCategory: 'Impact',
  });
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(76),
    sourceSystem: 'Splunk SIEM',
    eventType: 'High Entropy File Encryption Activity',
    sourceIp: '192.168.1.105',
    destinationIp: '192.168.1.105',
    username: 'm.williams',
    hostname: 'WS-FINANCE-04',
    severity: 'Critical',
    description: 'Over 1,200 local files modified with extension .locked within 45 seconds on accounting share',
    protocol: 'SMB',
    port: 445,
    eventCategory: 'Malware',
  });

  // SCENARIO 4: Port Scanning & Perimeter Probing (Attacker IP 194.26.29.112)
  for (let i = 0; i < 6; i++) {
    alerts.push({
      alertId: `ALT-${++seq}`,
      timestamp: mkTime(80 + i * 3),
      sourceSystem: 'Checkpoint Firewall',
      eventType: 'Perimeter Port Scan Detection',
      sourceIp: '194.26.29.112',
      destinationIp: '203.0.113.10',
      username: '',
      hostname: 'FW-EDGE-01',
      severity: 'Medium',
      description: `Dropping unsolicited inbound probe targeting port ${[22, 80, 443, 3389, 8443, 9200][i]}`,
      protocol: 'TCP',
      port: [22, 80, 443, 3389, 8443, 9200][i],
      eventCategory: 'Reconnaissance',
    });
  }

  // SCENARIO 5: C2 Beaconing via DNS Tunneling (Host WS-EXEC-LAPTOP)
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(95),
    sourceSystem: 'Suricata Network IDS',
    eventType: 'DNS Query Length Anomaly',
    sourceIp: '192.168.1.10',
    destinationIp: '8.8.8.8',
    username: 'd.chen@corp.internal',
    hostname: 'WS-EXEC-LAPTOP',
    severity: 'High',
    description: 'DNS queries with base64 TXT request payload exceeding 210 characters to dynamic domain',
    protocol: 'DNS',
    port: 53,
    eventCategory: 'Malware',
  });
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(102),
    sourceSystem: 'Palo Alto NGFW',
    eventType: 'Command and Control Beacon Frequency Match',
    sourceIp: '192.168.1.10',
    destinationIp: '103.251.167.20',
    username: 'd.chen@corp.internal',
    hostname: 'WS-EXEC-LAPTOP',
    severity: 'Critical',
    description: 'Periodic heartbeat traffic every 30.0 seconds with jitter < 2% matching Cobalt Strike beacon profile',
    protocol: 'HTTPS',
    port: 443,
    eventCategory: 'Malware',
  });

  // SCENARIO 6: Data Exfiltration from Database Server (SRV-SQL-BACKUP)
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(115),
    sourceSystem: 'AWS GuardDuty',
    eventType: 'Unauthorized Database Snapshot Export',
    sourceIp: '10.0.1.50',
    destinationIp: '54.210.12.11',
    username: 'backup_admin',
    hostname: 'SRV-SQL-BACKUP',
    severity: 'Critical',
    description: 'RDS production snapshot copied to external AWS account not registered in organization OU',
    protocol: 'HTTPS',
    port: 443,
    eventCategory: 'Exfiltration',
  });
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(120),
    sourceSystem: 'Cloudflare WAF',
    eventType: 'Mass Data Extraction via API',
    sourceIp: '45.33.32.156',
    destinationIp: '10.0.1.50',
    username: 'api_client_internal',
    hostname: 'SRV-SQL-BACKUP',
    severity: 'High',
    description: 'Over 50,000 PII records queried within 3 minutes exceeding normal API consumption velocity by 1,400%',
    protocol: 'HTTPS',
    port: 443,
    eventCategory: 'Exfiltration',
  });

  // SCENARIO 7: Unusual Administrative Activity (K8S Cluster & Domain Controller)
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(130),
    sourceSystem: 'Active Directory DC',
    eventType: 'Sensitive Privilege Use by Administrator',
    sourceIp: '172.16.0.4',
    destinationIp: '10.0.1.15',
    username: 'administrator',
    hostname: 'DC01.corp.internal',
    severity: 'Medium',
    description: 'SeSecurityPrivilege exercised to clear Security Event Log (Event ID 1102)',
    protocol: 'TCP',
    port: 389,
    eventCategory: 'Privilege Escalation',
  });
  alerts.push({
    alertId: `ALT-${++seq}`,
    timestamp: mkTime(135),
    sourceSystem: 'CrowdStrike Falcon EDR',
    eventType: 'Security Event Log Cleared on Domain Controller',
    sourceIp: '172.16.0.4',
    destinationIp: '10.0.1.15',
    username: 'administrator',
    hostname: 'DC01.corp.internal',
    severity: 'Critical',
    description: 'wevtutil.exe cl Security executed by non-standard interactive session',
    protocol: 'TCP',
    port: 0,
    eventCategory: 'Defense Evasion',
  });

  // SCENARIO 8: Suspicious Inbound Network Traffic Spikes (DDoS & SYN Flood)
  for (let i = 0; i < 5; i++) {
    alerts.push({
      alertId: `ALT-${++seq}`,
      timestamp: mkTime(140 + i * 2),
      sourceSystem: 'Palo Alto NGFW',
      eventType: 'Inbound SYN Flood Rate Limit Exceeded',
      sourceIp: '91.240.118.172',
      destinationIp: '203.0.113.88',
      username: '',
      hostname: 'FW-PERIMETER-01',
      severity: 'Medium',
      description: `Threat ID 8001: TCP SYN flood dropped 4,500 packets/sec on public web listener`,
      protocol: 'TCP',
      port: 443,
      eventCategory: 'Network',
    });
  }

  // SCENARIO 9: Duplicate Alerts Group (15 duplicate firewall alerts within 10 minutes)
  for (let i = 0; i < 15; i++) {
    alerts.push({
      alertId: `ALT-${++seq}`,
      timestamp: mkTime(155 + Math.floor(i / 3)),
      sourceSystem: 'Palo Alto NGFW',
      eventType: 'Suspicious External SSH Probing',
      sourceIp: '185.220.101.5',
      destinationIp: '203.0.113.88',
      username: 'root',
      hostname: 'GATEWAY-VPN-EXT',
      severity: 'Low',
      description: 'Firewall dropped repetitive SSH probe from repetitive scanning source on port 22',
      protocol: 'SSH',
      port: 22,
      eventCategory: 'Network',
    });
  }

  // SCENARIO 10: General Routine & Baseline Security Events (35 normal / informational alerts)
  const routineEvents = [
    { type: 'Scheduled Antivirus Scan Completed', cat: 'Malware', sev: 'Low', sys: 'Microsoft Defender for Endpoint', desc: 'Full weekly disk scan finished cleanly. 0 threats detected.' },
    { type: 'VPN Session Connected Successfully', cat: 'Authentication', sev: 'Low', sys: 'Cisco ASA', desc: 'User m.williams connected via SSL VPN gateway with 2FA token.' },
    { type: 'TLS Certificate Validated', cat: 'Network', sev: 'Low', sys: 'Cloudflare WAF', desc: 'Inbound HTTPS connection negotiated TLS 1.3 with valid ECDSA cipher.' },
    { type: 'Configuration Backup Exported', cat: 'Security Event', sev: 'Low', sys: 'Palo Alto NGFW', desc: 'Nightly XML configuration backup successfully transferred to internal SFTP.' },
    { type: 'DHCP Lease Renewed', cat: 'Network', sev: 'Low', sys: 'Active Directory DC', desc: 'Workstation WS-FINANCE-04 renewed IP lease 192.168.1.105 for 24 hours.' },
    { type: 'Normal File Access Event', cat: 'Security Event', sev: 'Low', sys: 'Splunk SIEM', desc: 'Shared document Marketing_Plan_2026.pdf read by authorized group member.' },
    { type: 'Package Manager System Update', cat: 'Security Event', sev: 'Low', sys: 'CrowdStrike Falcon EDR', desc: 'apt-get upgrade completed successfully on internal staging repository node.' },
  ];

  for (let i = 0; i < 50; i++) {
    const pick = routineEvents[i % routineEvents.length];
    alerts.push({
      alertId: `ALT-${++seq}`,
      timestamp: mkTime(10 + i * 3),
      sourceSystem: pick.sys,
      eventType: pick.type,
      sourceIp: `192.168.1.${20 + (i % 30)}`,
      destinationIp: `10.0.1.${10 + (i % 20)}`,
      username: i % 2 === 0 ? 'corp_user' : 'analyst_temp',
      hostname: `WS-DEV-${(i % 15).toString().padStart(2, '0')}`,
      severity: pick.sev,
      description: pick.desc,
      protocol: 'TCP',
      port: 443,
      eventCategory: pick.cat,
    });
  }

  // Normalize each record
  return alerts.map((raw, idx) => normalizeRawAlert(raw, idx));
}
