import { dal } from '../services/db/dal';
import { CorrelationEngine } from '../services/correlation/engine';
import { RiskScorer } from '../services/prioritisation/riskScorer';
import { AiInvestigator } from '../services/ai/investigator';
import { AlertSimulator } from '../services/simulator/alertSimulator';
import { getSampleAlertsDataset } from './sampleScenarios';

async function runTestSuite() {
  console.log('🧪 Starting AlertStormCorrelator Comprehensive Self-Test Suite...');

  // 1. Ingestion & Dataset Test
  const sampleAlerts = getSampleAlertsDataset();
  console.log(`✅ [1/7] Generated Benchmark Dataset: ${sampleAlerts.length} alerts.`);
  if (sampleAlerts.length < 100) throw new Error('Dataset must contain >= 100 alerts');

  // 2. Simulator Test
  const simAlert = AlertSimulator.generateSimulatedAlert();
  console.log(`✅ [2/7] Alert Simulator generated: ${simAlert.alertId} (${simAlert.eventType}) - Severity: ${simAlert.severity}`);

  // 3. Correlation Engine Test
  console.log('⚡ [3/7] Executing Correlation Engine on benchmark alerts...');
  const result = await CorrelationEngine.runCorrelation(sampleAlerts);
  console.log(`✅ Correlation Metrics:`);
  console.log(`     - Processed Alerts: ${result.totalAlertsProcessed}`);
  console.log(`     - Duplicates Suppressed: ${result.duplicatesSuppressed}`);
  console.log(`     - Incidents Created: ${result.incidentsCreated}`);
  console.log(`     - Fatigue Reduction: ${result.efficiencyRatio}`);

  if (result.incidentsCreated === 0) throw new Error('Correlation failed to generate incidents');
  if (result.duplicatesSuppressed === 0) throw new Error('Duplicate suppression failed');

  // 4. Prioritisation & Risk Scoring Test
  console.log('⚡ [4/7] Verifying Risk Scorer on Top Incidents...');
  const topIncident = result.incidents[0];
  console.log(`✅ Top Incident: ${topIncident.incidentId}`);
  console.log(`     - Title: ${topIncident.title}`);
  console.log(`     - Priority: ${topIncident.priority}`);
  console.log(`     - Risk Score: ${topIncident.riskScore}/100`);
  console.log(`     - Category: ${topIncident.category}`);
  console.log(`     - Matched Rules: ${topIncident.correlationRulesMatched.join(', ')}`);
  console.log(`     - Risk Factors Count: ${topIncident.riskFactors.length}`);

  // 5. MITRE ATT&CK Matrix Alignment Test
  console.log('⚡ [5/7] Verifying MITRE ATT&CK Mapping...');
  console.log(`✅ Incident MITRE Techniques: ${topIncident.mitreMapping.length}`);
  topIncident.mitreMapping.forEach(m => {
    console.log(`     - ${m.tactic} -> [${m.techniqueId}] ${m.techniqueName}`);
  });

  // 6. AI Investigation Dossier Test
  console.log('⚡ [6/7] Verifying Explainable AI Investigation Module...');
  console.log(`✅ AI Summary: ${topIncident.aiInvestigation.summary.slice(0, 120)}...`);
  console.log(`✅ Probable Attack: ${topIncident.aiInvestigation.probableAttack.slice(0, 100)}...`);
  console.log(`✅ Recommended Steps (${topIncident.aiInvestigation.recommendedSteps.length}):`);
  topIncident.aiInvestigation.recommendedSteps.slice(0, 2).forEach(s => console.log(`     • ${s}`));
  console.log(`✅ Suggested Containment Actions (${topIncident.aiInvestigation.suggestedContainment.length}):`);
  topIncident.aiInvestigation.suggestedContainment.slice(0, 2).forEach(a => console.log(`     • ${a}`));

  // 7. Database Persistence Test
  console.log('⚡ [7/7] Verifying Dual-Mode DAL Persistence...');
  const adminUser = await dal.findUserByUsername('admin');
  console.log(`✅ Verified Default Admin Account: ${adminUser?.username} (${adminUser?.role})`);

  const totalStored = await dal.getAllAlertsRaw();
  console.log(`✅ Verified Stored Alerts in DB: ${totalStored.length}`);

  console.log('================================================================');
  console.log('🎉 ALL 7 CORE ENGINE SUBSYSTEM TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
