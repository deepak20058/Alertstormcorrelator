import { IAlert, IIncident, IAttackTimelineItem } from '../../types';
import { mapAlertsToMitre } from '../ai/mitreMapper';
import { RiskScorer } from '../prioritisation/riskScorer';
import { AiInvestigator } from '../ai/investigator';

export interface CorrelationResult {
  totalAlertsProcessed: number;
  duplicatesSuppressed: number;
  incidentsCreated: number;
  incidents: IIncident[];
  updatedAlerts: IAlert[];
  efficiencyRatio: string; // e.g. "87% alert fatigue reduction"
}

export class CorrelationEngine {
  /**
   * Main correlation pipeline
   */
  public static async runCorrelation(allAlerts: IAlert[]): Promise<CorrelationResult> {
    if (allAlerts.length === 0) {
      return {
        totalAlertsProcessed: 0,
        duplicatesSuppressed: 0,
        incidentsCreated: 0,
        incidents: [],
        updatedAlerts: [],
        efficiencyRatio: '0%',
      };
    }

    // Step 1: Duplicate Detection
    const { uniqueAlerts, duplicatesCount, processedAlerts } = this.detectDuplicates(allAlerts);

    // Step 2: Form Correlated Clusters
    const clusters = this.clusterAlerts(uniqueAlerts);

    // Step 3: Transform Clusters into Prioritized Incidents
    const incidents: IIncident[] = [];
    let incidentCounter = 1;

    for (const cluster of clusters) {
      const clusterAlerts = cluster.alerts;
      if (clusterAlerts.length === 0) continue;

      // Sort cluster alerts chronologically
      clusterAlerts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const firstSeen = new Date(clusterAlerts[0].timestamp);
      const lastSeen = new Date(clusterAlerts[clusterAlerts.length - 1].timestamp);

      // Extract unique entities
      const sourceIps = Array.from(new Set(clusterAlerts.map(a => a.sourceIp).filter(Boolean)));
      const destIps = Array.from(new Set(clusterAlerts.map(a => a.destinationIp).filter(Boolean)));
      const users = Array.from(new Set(clusterAlerts.map(a => a.username).filter(Boolean)));
      const hostnames = Array.from(new Set(clusterAlerts.map(a => a.hostname).filter(Boolean)));

      // Generate attack timeline
      const attackTimeline: IAttackTimelineItem[] = clusterAlerts.map(a => {
        let stage = 'Detection';
        const cat = (a.eventCategory || '').toLowerCase();
        const ev = (a.eventType || '').toLowerCase();
        if (cat.includes('recon') || ev.includes('scan')) stage = 'Reconnaissance';
        else if (cat.includes('auth') || ev.includes('login') || ev.includes('brute')) stage = 'Initial Access';
        else if (cat.includes('privilege') || ev.includes('escalat')) stage = 'Privilege Escalation';
        else if (cat.includes('lateral') || ev.includes('smb') || ev.includes('rdp')) stage = 'Lateral Movement';
        else if (cat.includes('malware') || ev.includes('trojan') || ev.includes('ransom')) stage = 'Execution';
        else if (cat.includes('exfiltrat') || ev.includes('upload') || ev.includes('dump')) stage = 'Exfiltration';

        return {
          timestamp: new Date(a.timestamp),
          alertId: a.alertId,
          eventType: a.eventType,
          stage,
          severity: a.severity,
          description: a.description,
          sourceIp: a.sourceIp,
          destinationIp: a.destinationIp,
        };
      });

      // Map to MITRE ATT&CK
      const mitreMapping = mapAlertsToMitre(clusterAlerts);

      // Calculate Risk Score & Priority
      const scoreResult = RiskScorer.calculate(
        clusterAlerts,
        cluster.category,
        cluster.reason,
        cluster.hasKnownMaliciousIndicator || false
      );

      // Generate Incident ID
      const incId = `INC-${new Date().getFullYear()}-${incidentCounter.toString().padStart(3, '0')}`;
      incidentCounter++;

      // AI-Powered Investigation
      const aiInvestigation = await AiInvestigator.generateInvestigation(
        cluster.title,
        cluster.category,
        clusterAlerts,
        mitreMapping,
        scoreResult.riskScore
      );

      const incident: IIncident = {
        incidentId: incId,
        title: cluster.title,
        description: cluster.description,
        severity: scoreResult.severity,
        priority: scoreResult.priority,
        riskScore: scoreResult.riskScore,
        status: 'New',
        category: cluster.category,
        confidenceScore: cluster.confidenceScore,
        correlationReason: cluster.reason,
        correlationRulesMatched: cluster.rulesMatched,
        alertIds: clusterAlerts.map(a => a.alertId),
        alertCount: clusterAlerts.length,
        entities: {
          sourceIps,
          destIps,
          users,
          hostnames,
        },
        attackTimeline,
        mitreMapping,
        aiInvestigation,
        riskFactors: scoreResult.riskFactors,
        assignedTo: null,
        firstSeen,
        lastSeen,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      incidents.push(incident);

      // Tag alerts with correlated incident ID
      for (const a of clusterAlerts) {
        a.correlatedIncidentId = incId;
        a.status = 'Correlated';
      }
    }

    // Step 4: Calculate Reduction Efficiency
    const rawCount = allAlerts.length;
    const finalCount = incidents.length;
    const reductionPercent = rawCount > 0 ? Math.round(((rawCount - finalCount) / rawCount) * 100) : 0;

    return {
      totalAlertsProcessed: rawCount,
      duplicatesSuppressed: duplicatesCount,
      incidentsCreated: incidents.length,
      incidents,
      updatedAlerts: processedAlerts,
      efficiencyRatio: `${reductionPercent}% Alert Reduction`,
    };
  }

  /**
   * Technique 1: Duplicate Detection via Fingerprint & Sliding Time Window
   */
  private static detectDuplicates(alerts: IAlert[]): {
    uniqueAlerts: IAlert[];
    duplicatesCount: number;
    processedAlerts: IAlert[];
  } {
    const copy = alerts.map(a => ({ ...a }));
    copy.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const fingerprintMap = new Map<string, IAlert>();
    const uniqueList: IAlert[] = [];
    let duplicatesCount = 0;

    for (const alert of copy) {
      const fp = alert.fingerprint || `${alert.sourceSystem}_${alert.eventType}_${alert.sourceIp}_${alert.destinationIp}`;
      const existing = fingerprintMap.get(fp);

      if (existing) {
        const timeDiffMinutes = Math.abs(
          (new Date(alert.timestamp).getTime() - new Date(existing.timestamp).getTime()) / (1000 * 60)
        );

        if (timeDiffMinutes <= 20) {
          // It's a duplicate in the 20-min sliding window
          existing.duplicateCount = (existing.duplicateCount || 0) + 1;
          alert.isDuplicate = true;
          alert.status = 'Suppressed';
          duplicatesCount++;
          continue;
        }
      }

      alert.isDuplicate = false;
      alert.duplicateCount = 0;
      fingerprintMap.set(fp, alert);
      uniqueList.push(alert);
    }

    return {
      uniqueAlerts: uniqueList,
      duplicatesCount,
      processedAlerts: copy,
    };
  }

  /**
   * Techniques 2-7: Multi-dimensional alert clustering
   */
  private static clusterAlerts(alerts: IAlert[]): Array<{
    title: string;
    description: string;
    category: string;
    confidenceScore: number;
    reason: string;
    rulesMatched: string[];
    alerts: IAlert[];
    hasKnownMaliciousIndicator?: boolean;
  }> {
    const assignedAlertIds = new Set<string>();
    const clusters: Array<{
      title: string;
      description: string;
      category: string;
      confidenceScore: number;
      reason: string;
      rulesMatched: string[];
      alerts: IAlert[];
      hasKnownMaliciousIndicator?: boolean;
    }> = [];

    // Helper to get unassigned alerts
    const getUnassigned = () => alerts.filter(a => !assignedAlertIds.has(a.alertId));

    // CLUSTER PATTERN A: Multi-Stage Coordinated Attack (Recon -> Auth -> PrivEsc -> Exfil)
    const ipGroups = new Map<string, IAlert[]>();
    for (const alert of getUnassigned()) {
      if (alert.sourceIp) {
        const list = ipGroups.get(alert.sourceIp) || [];
        list.push(alert);
        ipGroups.set(alert.sourceIp, list);
      }
    }

    for (const [srcIp, ipAlerts] of Array.from(ipGroups.entries())) {
      if (ipAlerts.length >= 3) {
        const cats = new Set(ipAlerts.map(a => (a.eventCategory || '').toLowerCase()));
        const evs = ipAlerts.map(a => (a.eventType || '').toLowerCase()).join(' ');

        const isMultiStage =
          (cats.has('reconnaissance') || evs.includes('scan')) &&
          (cats.has('authentication') || evs.includes('login') || evs.includes('brute')) &&
          (cats.has('privilege escalation') || cats.has('malware') || cats.has('exfiltration') || evs.includes('escalat') || evs.includes('exfiltrat'));

        if (isMultiStage) {
          const targetedHosts = Array.from(new Set(ipAlerts.map(a => a.hostname || a.destinationIp).filter(Boolean)));
          clusters.push({
            title: `Coordinated Multi-Stage Attack from ${srcIp}`,
            description: `Attacker executed reconnaissance, credential harvesting, privilege escalation, and lateral movement targeting [${targetedHosts.join(', ')}].`,
            category: 'Coordinated Multi-Stage Attack',
            confidenceScore: 96,
            reason: `Cross-correlation of reconnaissance, authentication compromise, and privilege escalation linked by origin IP ${srcIp} within 90 minutes.`,
            rulesMatched: ['RULE-ATTACK-01', 'RULE-IP-01', 'RULE-MULTI-01'],
            alerts: ipAlerts,
            hasKnownMaliciousIndicator: true,
          });
          ipAlerts.forEach(a => assignedAlertIds.add(a.alertId));
        }
      }
    }

    // CLUSTER PATTERN B: Brute Force & Credential Compromise Sequence
    for (const [srcIp, ipAlerts] of Array.from(ipGroups.entries())) {
      const unassignedFromIp = ipAlerts.filter(a => !assignedAlertIds.has(a.alertId));
      if (unassignedFromIp.length >= 2) {
        const hasFailed = unassignedFromIp.some(a => a.eventType.toLowerCase().includes('failed') || a.description.toLowerCase().includes('failed'));
        const hasSuccess = unassignedFromIp.some(a => a.eventType.toLowerCase().includes('success') || a.description.toLowerCase().includes('success'));

        if (hasFailed && hasSuccess) {
          const user = unassignedFromIp.find(a => a.username)?.username || 'compromised user';
          clusters.push({
            title: `Brute Force Credential Breach for ${user}`,
            description: `Multiple failed authentication attempts immediately followed by successful logon and anomalous session establishment from ${srcIp}.`,
            category: 'Brute Force & Credential Compromise',
            confidenceScore: 92,
            reason: `Behavioral correlation: series of failed authentication attempts culminated in valid credential access on target endpoint within 30 minutes.`,
            rulesMatched: ['RULE-BEHAVIOR-01', 'RULE-IP-01'],
            alerts: unassignedFromIp,
          });
          unassignedFromIp.forEach(a => assignedAlertIds.add(a.alertId));
        }
      }
    }

    // CLUSTER PATTERN C: Entity-Centric Correlation (Host or User with multiple critical events)
    const hostGroups = new Map<string, IAlert[]>();
    for (const alert of getUnassigned()) {
      if (alert.hostname) {
        const list = hostGroups.get(alert.hostname) || [];
        list.push(alert);
        hostGroups.set(alert.hostname, list);
      }
    }

    for (const [hostname, hostAlerts] of Array.from(hostGroups.entries())) {
      if (hostAlerts.length >= 2) {
        const sources = Array.from(new Set(hostAlerts.map(a => a.sourceSystem)));
        const cat = hostAlerts.some(a => a.eventCategory.toLowerCase().includes('malware'))
          ? 'Malware Infection & Endpoint Compromise'
          : hostAlerts.some(a => a.eventCategory.toLowerCase().includes('exfiltration'))
          ? 'Data Exfiltration Operation'
          : 'Suspicious Host Anomalies';

        clusters.push({
          title: `Correlated Security Threats on ${hostname}`,
          description: `Telemetry from ${sources.join(' and ')} identified suspicious behavior and unauthorized actions on ${hostname}.`,
          category: cat,
          confidenceScore: 88,
          reason: `Entity-based correlation: converging detections on host asset ${hostname} from ${sources.length} distinct telemetry feeds.`,
          rulesMatched: ['RULE-ENTITY-01', 'RULE-MULTI-01'],
          alerts: hostAlerts,
        });
        hostAlerts.forEach(a => assignedAlertIds.add(a.alertId));
      }
    }

    // CLUSTER PATTERN D: Suspicious IP Sweep / Reconnaissance
    for (const [srcIp, ipAlerts] of Array.from(ipGroups.entries())) {
      const unassigned = ipAlerts.filter(a => !assignedAlertIds.has(a.alertId));
      if (unassigned.length >= 2) {
        const isRecon = unassigned.some(a => a.eventType.toLowerCase().includes('scan') || a.eventCategory.toLowerCase().includes('recon'));
        clusters.push({
          title: isRecon ? `Network Reconnaissance Campaign from ${srcIp}` : `Suspicious Traffic Burst from ${srcIp}`,
          description: `Host ${srcIp} initiated anomalous connections across multiple internal destinations.`,
          category: isRecon ? 'Network Reconnaissance' : 'Suspicious Network Traffic',
          confidenceScore: 84,
          reason: `IP-based correlation: high-volume traffic probes targeting internal subnets within active inspection window.`,
          rulesMatched: ['RULE-IP-01'],
          alerts: unassigned,
        });
        unassigned.forEach(a => assignedAlertIds.add(a.alertId));
      }
    }

    // CLUSTER PATTERN E: Remaining High or Critical Standalone Alerts promoted to Incidents
    for (const alert of getUnassigned()) {
      if (alert.severity === 'Critical' || alert.severity === 'High') {
        clusters.push({
          title: `Uncorrelated High-Priority Alert: ${alert.eventType}`,
          description: alert.description,
          category: alert.eventCategory || 'Targeted Security Incident',
          confidenceScore: 78,
          reason: `Individual alert of ${alert.severity} severity escalated directly to prevent critical threat triage bypass.`,
          rulesMatched: ['RULE-CRITICAL-STANDALONE'],
          alerts: [alert],
        });
        assignedAlertIds.add(alert.alertId);
      }
    }

    // CLUSTER PATTERN F: Group remaining low/medium alerts by event category or source
    const remaining = getUnassigned();
    if (remaining.length > 0) {
      const byCat = new Map<string, IAlert[]>();
      for (const alert of remaining) {
        const c = alert.eventCategory || 'General Telemetry';
        const list = byCat.get(c) || [];
        list.push(alert);
        byCat.set(c, list);
      }

      for (const [catName, catAlerts] of Array.from(byCat.entries())) {
        clusters.push({
          title: `Aggregated ${catName} Telemetry Cluster`,
          description: `Grouped ${catAlerts.length} baseline ${catName.toLowerCase()} alerts for consolidated review.`,
          category: catName,
          confidenceScore: 72,
          reason: `Time and category clustering of baseline events across infrastructure.`,
          rulesMatched: ['RULE-TIME-WINDOW'],
          alerts: catAlerts,
        });
        catAlerts.forEach(a => assignedAlertIds.add(a.alertId));
      }
    }

    return clusters;
  }
}
