import { IAlert, IncidentPriority, IRiskFactor, AlertSeverity } from '../../types';

export interface ScoreCalculationResult {
  riskScore: number;
  priority: IncidentPriority;
  severity: AlertSeverity;
  riskFactors: IRiskFactor[];
  potentialImpact: string;
}

export class RiskScorer {
  public static calculate(
    alerts: IAlert[],
    category: string,
    correlationReason: string,
    isExternalMaliciousIp = false
  ): ScoreCalculationResult {
    let score = 0;
    const riskFactors: IRiskFactor[] = [];

    // 1. Base Severity Contribution (Max 35 pts)
    const hasCrit = alerts.some(a => a.severity === 'Critical');
    const hasHigh = alerts.some(a => a.severity === 'High');
    const hasMed = alerts.some(a => a.severity === 'Medium');

    if (hasCrit) {
      score += 35;
      riskFactors.push({
        factor: 'Critical Base Telemetry',
        scoreImpact: 35,
        description: 'Contains one or more alerts originally triaged at Critical severity',
      });
    } else if (hasHigh) {
      score += 25;
      riskFactors.push({
        factor: 'High Severity Detection',
        scoreImpact: 25,
        description: 'Contains high-severity alert telemetry from primary sensors',
      });
    } else if (hasMed) {
      score += 15;
      riskFactors.push({
        factor: 'Medium Baseline Severity',
        scoreImpact: 15,
        description: 'Medium severity anomaly signals observed',
      });
    } else {
      score += 8;
      riskFactors.push({
        factor: 'Low/Informational Signal',
        scoreImpact: 8,
        description: 'Standard informational or low-priority telemetry baseline',
      });
    }

    // 2. Alert Volume & Amplification (Max 15 pts)
    const count = alerts.length;
    if (count >= 15) {
      score += 15;
      riskFactors.push({
        factor: 'High Alert Volume Burst',
        scoreImpact: 15,
        description: `Correlated across ${count} alerts indicating intense attack burst or automated tool`,
      });
    } else if (count >= 6) {
      score += 10;
      riskFactors.push({
        factor: 'Moderate Alert Density',
        scoreImpact: 10,
        description: `Cluster contains ${count} correlated event records`,
      });
    } else if (count >= 2) {
      score += 5;
      riskFactors.push({
        factor: 'Multi-Alert Cluster',
        scoreImpact: 5,
        description: `Grouped ${count} corroborating alert records`,
      });
    }

    // 3. Attack Pattern & Multi-Stage Progression (Max 25 pts)
    const catLower = category.toLowerCase();
    const eventTypesLower = alerts.map(a => a.eventType.toLowerCase()).join(' ');

    if (
      catLower.includes('multi-stage') ||
      catLower.includes('kill-chain') ||
      (eventTypesLower.includes('failed') && eventTypesLower.includes('escalat')) ||
      (eventTypesLower.includes('recon') && eventTypesLower.includes('exfiltrat'))
    ) {
      score += 25;
      riskFactors.push({
        factor: 'Advanced Coordinated Kill-Chain',
        scoreImpact: 25,
        description: 'Attack pattern spans multiple kill-chain phases (Recon -> Access -> Elevation -> Exfiltration)',
      });
    } else if (catLower.includes('exfiltration') || eventTypesLower.includes('exfiltrat') || eventTypesLower.includes('dump')) {
      score += 22;
      riskFactors.push({
        factor: 'Data Exfiltration / Confidentiality Loss Risk',
        scoreImpact: 22,
        description: 'High likelihood of sensitive data egress or database compromise',
      });
    } else if (catLower.includes('privilege') || eventTypesLower.includes('privilege') || eventTypesLower.includes('root')) {
      score += 18;
      riskFactors.push({
        factor: 'Privilege Escalation Detected',
        scoreImpact: 18,
        description: 'Attacker acquired administrative or SYSTEM rights',
      });
    } else if (catLower.includes('malware') || catLower.includes('ransomware') || eventTypesLower.includes('ransom')) {
      score += 20;
      riskFactors.push({
        factor: 'Malicious Executable / Ransomware Vector',
        scoreImpact: 20,
        description: 'Payload execution or known malware signature identified on endpoint',
      });
    } else if (catLower.includes('brute') || catLower.includes('credential')) {
      score += 14;
      riskFactors.push({
        factor: 'Credential Compromise Vulnerability',
        scoreImpact: 14,
        description: 'Active brute force or password spraying targeting corporate identities',
      });
    } else {
      score += 8;
      riskFactors.push({
        factor: 'Standard Security Category',
        scoreImpact: 8,
        description: `Classified under ${category}`,
      });
    }

    // 4. Asset Criticality (Max 15 pts)
    const hostnames = alerts.map(a => (a.hostname || '').toLowerCase()).join(' ');
    const ips = alerts.map(a => `${a.sourceIp} ${a.destinationIp}`).join(' ').toLowerCase();

    if (hostnames.includes('dc') || hostnames.includes('prod') || hostnames.includes('finance') || hostnames.includes('db') || ips.includes('.10.') || ips.includes('192.168.1.1')) {
      score += 15;
      riskFactors.push({
        factor: 'Tier-1 Crown Jewel Asset Targeted',
        scoreImpact: 15,
        description: 'Involves mission-critical domain controllers, production databases, or core infrastructure',
      });
    } else if (hostnames.length > 0) {
      score += 8;
      riskFactors.push({
        factor: 'Internal Enterprise Host Involved',
        scoreImpact: 8,
        description: 'Enterprise internal workstation or server entity identified in attack path',
      });
    }

    // 5. Threat Intelligence Reputation Match (Max 10 pts)
    if (isExternalMaliciousIp) {
      score += 10;
      riskFactors.push({
        factor: 'Threat Intelligence Known Malicious Match',
        scoreImpact: 10,
        description: 'Source IP or IOC flagged in global threat feed as active C2 or malicious botnet node',
      });
    }

    // Bound score between 5 and 100
    const finalScore = Math.min(100, Math.max(5, score));

    // Determine Priority & Severity
    let priority: IncidentPriority;
    let severity: AlertSeverity;

    if (finalScore >= 90) {
      priority = 'Critical';
      severity = 'Critical';
    } else if (finalScore >= 70) {
      priority = 'High';
      severity = 'High';
    } else if (finalScore >= 40) {
      priority = 'Medium';
      severity = 'Medium';
    } else {
      priority = 'Low';
      severity = 'Low';
    }

    // Potential Business Impact
    let potentialImpact = 'Low operational disruption. Standard automated containment recommended.';
    if (finalScore >= 90) {
      potentialImpact = 'CRITICAL: Severe risk of enterprise-wide compromise, data exfiltration, regulatory penalties, and business disruption. Immediate SOC Tier-3 triage mandated.';
    } else if (finalScore >= 70) {
      potentialImpact = 'HIGH: Potential unauthorized account access, lateral propagation, or disruption of confidential departmental workloads.';
    } else if (finalScore >= 40) {
      potentialImpact = 'MODERATE: Suspicious anomaly confined to individual endpoint or perimeter edge. Moderate risk if uncontained.';
    }

    return {
      riskScore: finalScore,
      priority,
      severity,
      riskFactors,
      potentialImpact,
    };
  }
}
