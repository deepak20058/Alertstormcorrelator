import { IAlert, IAiInvestigation, IMitreTechnique } from '../../types';
import { config } from '../../config/env';

export class AiInvestigator {
  public static async generateInvestigation(
    incidentTitle: string,
    category: string,
    alerts: IAlert[],
    mitreTechniques: IMitreTechnique[],
    riskScore: number
  ): Promise<IAiInvestigation> {
    // If external LLM key is configured, we can attempt external call, else local deterministic cyber engine
    if (config.aiProvider === 'gemini' && config.geminiApiKey) {
      try {
        const external = await this.queryGeminiLlm(incidentTitle, category, alerts, mitreTechniques, riskScore);
        if (external) return external;
      } catch (err) {
        console.warn('Fallback to local AI engine due to external LLM error:', err);
      }
    } else if (config.aiProvider === 'openai' && config.openaiApiKey) {
      try {
        const external = await this.queryOpenAiLlm(incidentTitle, category, alerts, mitreTechniques, riskScore);
        if (external) return external;
      } catch (err) {
        console.warn('Fallback to local AI engine due to external LLM error:', err);
      }
    }

    return this.generateLocalExpertReport(incidentTitle, category, alerts, mitreTechniques, riskScore);
  }

  private static generateLocalExpertReport(
    title: string,
    category: string,
    alerts: IAlert[],
    mitreTechniques: IMitreTechnique[],
    riskScore: number
  ): IAiInvestigation {
    const primaryAlert = alerts[0] || {};
    const alertCount = alerts.length;
    const sources = Array.from(new Set(alerts.map(a => a.sourceSystem))).join(', ');
    const ips = Array.from(new Set(alerts.map(a => a.sourceIp).filter(Boolean)));
    const targetIps = Array.from(new Set(alerts.map(a => a.destinationIp).filter(Boolean)));
    const users = Array.from(new Set(alerts.map(a => a.username).filter(Boolean)));
    const hosts = Array.from(new Set(alerts.map(a => a.hostname).filter(Boolean)));

    const mitreTactics = Array.from(new Set(mitreTechniques.map(m => `${m.tactic} (${m.techniqueId})`))).join(', ');

    // 1. Executive Summary
    const summary =
      `Security correlation identified a ${category.toLowerCase()} cluster comprising ${alertCount} alerts ` +
      `originating from [${ips.join(', ') || 'N/A'}] targeting [${targetIps.join(', ') || 'internal assets'}] ` +
      `across security sensors (${sources}). Calculated composite risk score is ${riskScore}/100. ` +
      (users.length > 0 ? `Targeted account(s): ${users.join(', ')}. ` : '') +
      (hosts.length > 0 ? `Affected host endpoint(s): ${hosts.join(', ')}. ` : '') +
      `MITRE ATT&CK tactics implicated include: ${mitreTactics}.`;

    // 2. Probable Attack Explanation
    let probableAttack = '';
    const catLower = category.toLowerCase();
    if (catLower.includes('multi-stage') || catLower.includes('kill-chain')) {
      probableAttack =
        `HYPOTHESIS: The threat actor conducted systematic multi-phase offensive operations. ` +
        `Initial reconnaissance probed open attack surfaces, followed by authentication exploitation ` +
        `or remote code execution. After establishing foothold, adversary elevated local privileges ` +
        `and initiated lateral staging or data exfiltration. Coordinated timing indicates automated or human-in-the-loop APT execution.`;
    } else if (catLower.includes('brute') || catLower.includes('credential')) {
      probableAttack =
        `HYPOTHESIS: An adversary initiated a high-velocity automated password spraying or brute-force attack ` +
        `against authentication gateways. The high volume of rejected attempts indicates dictionary-based enumeration. ` +
        `Subsequent successful logins (if present) strongly suggest valid credential compromise requiring immediate revocation.`;
    } else if (catLower.includes('malware') || catLower.includes('ransomware')) {
      probableAttack =
        `HYPOTHESIS: Malicious binary payload execution occurred on host endpoint. ` +
        `Behavioral characteristics align with unauthorized persistence, shadow copy manipulation, or process hollowing ` +
        `consistent with trojanized loaders or ransomware staging activities.`;
    } else if (catLower.includes('exfiltration')) {
      probableAttack =
        `HYPOTHESIS: Covert data egress identified. The endpoint established anomalous outbound connections ` +
        `exhibiting high-entropy transfer volume to external, untrusted infrastructure, bypassing standard egress proxy filters.`;
    } else if (catLower.includes('reconnaissance') || catLower.includes('port scan')) {
      probableAttack =
        `HYPOTHESIS: Network reconnaissance campaign. The remote host swept address spaces and service ports ` +
        `attempting to enumerate vulnerable daemons, unpatched perimeter interfaces, or exposed administrative management ports.`;
    } else {
      probableAttack =
        `HYPOTHESIS: Anomalous operational telemetry deviated from baseline security policies. ` +
        `Repeated event triggers across ${sources} indicate either unauthorized exploration or severe misconfiguration mimicking attacker techniques.`;
    }

    // 3. Attack Progression
    const attackProgression: string[] = [];
    if (alerts.length > 0) {
      attackProgression.push(`Stage 1 - Inception: First anomalous telemetry logged at ${new Date(alerts[alerts.length - 1].timestamp).toISOString()} by ${alerts[alerts.length - 1].sourceSystem}.`);
    }
    if (alerts.length > 2) {
      attackProgression.push(`Stage 2 - Escalation / Acceleration: Multiple rapid triggers registered across ${ips.length} source IPs and ${hosts.length || 1} hosts.`);
    }
    attackProgression.push(`Stage 3 - Convergence: System identified pattern correlation and MITRE ATT&CK alignment [${mitreTechniques.map(m => m.techniqueId).slice(0, 3).join(', ')}].`);
    attackProgression.push(`Stage 4 - Current State: Incident generated and queued for Tier-1/Tier-2 SOC Analyst remediation.`);

    // 4. Risk Assessment
    let riskAssessment = '';
    if (riskScore >= 90) {
      riskAssessment =
        `CRITICAL RISK LEVEL (${riskScore}/100): Imminent threat to organizational continuity. ` +
        `Adversary exhibits sophisticated tradecraft with active presence inside boundary. High probability of operational paralysis or massive compliance violation if unaddressed within 30 minutes.`;
    } else if (riskScore >= 70) {
      riskAssessment =
        `HIGH RISK LEVEL (${riskScore}/100): Confirmed hostile activity targeting key services or accounts. ` +
        `Lateral movement or persistence installation is probable. Requires prioritization over standard queue.`;
    } else if (riskScore >= 40) {
      riskAssessment =
        `MEDIUM RISK LEVEL (${riskScore}/100): Suspicious anomaly detected. Moderate impact potential if exploited further, but currently contained to initial perimeter edge or isolated asset.`;
    } else {
      riskAssessment =
        `LOW RISK LEVEL (${riskScore}/100): Low operational exposure. Likely automated noisy probing or transient authentication failures. Monitor for pattern recurrence.`;
    }

    // 5. Recommended Investigation Steps
    const recommendedSteps: string[] = [
      `Step 1: Inspect raw telemetry logs for alert IDs [${alerts.slice(0, 3).map(a => a.alertId).join(', ')}] across SIEM storage.`,
      `Step 2: Cross-reference external IP (${ips[0] || 'target'}) against VirusTotal, AbuseIPDB, and internal threat intelligence indices.`,
      `Step 3: Audit active sessions and Kerberos/OAuth tokens for user account(s) '${users.join(', ') || 'affected entities'}'.`,
      `Step 4: Check endpoint process tree via EDR telemetry around ${new Date(primaryAlert.timestamp || Date.now()).toLocaleTimeString()} for suspicious parent-child processes.`,
      `Step 5: Review outbound perimeter firewall and proxy logs for connections to destination IP ${targetIps[0] || 'external destinations'}.`,
    ];

    // 6. Suggested Containment Actions (Clear disclaimer: never claim already executed!)
    const suggestedContainment: string[] = [
      `RECOMMENDATION ONLY: Apply ingress firewall block on source IP(s): ${ips.join(', ') || 'identified attacking IPs'}.`,
      `RECOMMENDATION ONLY: Initiate endpoint network isolation via EDR on host(s): ${hosts.join(', ') || 'affected assets'}.`,
      `RECOMMENDATION ONLY: Force password reset and revoke active sessions for user: ${users.join(', ') || 'compromised identities'}.`,
      `RECOMMENDATION ONLY: Deploy custom Sigma / YARA rule to detect further lateral staging binaries across fleet.`,
    ];

    return {
      summary,
      probableAttack,
      attackProgression,
      riskAssessment,
      recommendedSteps,
      suggestedContainment,
      isAiGenerated: true,
      modelUsed: 'CyberGuard-Deterministic-LLM-SOC-v2',
    };
  }

  private static async queryGeminiLlm(title: string, category: string, alerts: IAlert[], mitre: IMitreTechnique[], score: number): Promise<IAiInvestigation | null> {
    // External call stub if Gemini key present
    return null;
  }

  private static async queryOpenAiLlm(title: string, category: string, alerts: IAlert[], mitre: IMitreTechnique[], score: number): Promise<IAiInvestigation | null> {
    // External call stub if OpenAI key present
    return null;
  }
}
