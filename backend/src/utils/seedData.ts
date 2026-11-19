import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { connectDatabase } from '../config/database';
import { dal } from '../services/db/dal';
import { defaultCorrelationRules } from '../services/correlation/rules';
import { getSampleAlertsDataset } from './sampleScenarios';
import { CorrelationEngine } from '../services/correlation/engine';
import { IThreatIndicator } from '../types';

export async function seedDatabase(forceClean = false) {
  console.log('🌱 Starting AlertStormCorrelator Database Seeding...');
  await connectDatabase();

  if (forceClean) {
    await dal.clearAllAlertsAndIncidents();
  }

  // 1. Seed Default Users
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const analystPasswordHash = await bcrypt.hash('Analyst@12345', 10);

  const existingAdmin = await dal.findUserByUsername('admin');
  if (!existingAdmin) {
    await dal.createUser({
      username: 'admin',
      email: 'admin@alertstorm.io',
      passwordHash: adminPasswordHash,
      name: 'Chief Information Security Officer (Admin)',
      role: 'Administrator',
      createdAt: new Date(),
    });
    console.log('✅ Created default Administrator: admin@alertstorm.io');
  }

  const existingAnalyst = await dal.findUserByUsername('analyst');
  if (!existingAnalyst) {
    await dal.createUser({
      username: 'analyst',
      email: 'analyst@alertstorm.io',
      passwordHash: analystPasswordHash,
      name: 'Senior SOC Incident Responder',
      role: 'Security Analyst',
      createdAt: new Date(),
    });
    console.log('✅ Created default Security Analyst: analyst@alertstorm.io');
  }

  // 2. Seed Correlation Rules
  const existingRules = await dal.getRules();
  if (existingRules.length === 0) {
    await dal.setAllRules(defaultCorrelationRules);
    console.log(`✅ Loaded ${defaultCorrelationRules.length} correlation detection rules`);
  }

  // 3. Seed Threat Intelligence Indicators
  const threatIndicators: IThreatIndicator[] = [
    {
      indicator: '198.51.100.42',
      type: 'IP',
      reputation: 'Malicious',
      threatScore: 96,
      threatCategory: 'APT Command & Control (C2)',
      associatedActors: ['APT29', 'Nobelium', 'Midnight Blizzard'],
      lastObserved: new Date(),
      matchedAlertCount: 7,
      country: 'NL',
      asn: 'AS49453',
    },
    {
      indicator: '185.220.101.5',
      type: 'IP',
      reputation: 'Malicious',
      threatScore: 92,
      threatCategory: 'Tor Exit Node / Automated Credential Spray',
      associatedActors: ['Anonymous Botnet', 'FIN7'],
      lastObserved: new Date(),
      matchedAlertCount: 12,
      country: 'DE',
      asn: 'AS60729',
    },
    {
      indicator: '103.251.167.20',
      type: 'IP',
      reputation: 'Malicious',
      threatScore: 94,
      threatCategory: 'Cobalt Strike Beacon Endpoint',
      associatedActors: ['LockBit Affiliates', 'BlackCat'],
      lastObserved: new Date(),
      matchedAlertCount: 3,
      country: 'SG',
      asn: 'AS133177',
    },
    {
      indicator: '194.26.29.112',
      type: 'IP',
      reputation: 'Suspicious',
      threatScore: 78,
      threatCategory: 'Active Perimeter Vulnerability Scanner',
      associatedActors: ['ShadowServer Mass Prober'],
      lastObserved: new Date(),
      matchedAlertCount: 6,
      country: 'RU',
      asn: 'AS58224',
    },
    {
      indicator: '91.240.118.172',
      type: 'IP',
      reputation: 'Malicious',
      threatScore: 88,
      threatCategory: 'DDoS Reflection Node',
      associatedActors: ['Killnet', 'NoName057'],
      lastObserved: new Date(),
      matchedAlertCount: 5,
      country: 'UA',
      asn: 'AS44034',
    },
    {
      indicator: '45.33.32.156',
      type: 'IP',
      reputation: 'Suspicious',
      threatScore: 68,
      threatCategory: 'High Velocity API Scraping Proxy',
      associatedActors: ['Data Miner Cluster'],
      lastObserved: new Date(),
      matchedAlertCount: 2,
      country: 'US',
      asn: 'AS63949',
    },
  ];

  await dal.setThreatIndicators(threatIndicators);
  console.log(`✅ Loaded ${threatIndicators.length} threat intelligence indicators`);

  // 4. Seed Alerts & Execute Correlation
  const alertsData = getSampleAlertsDataset();
  console.log(`📦 Generated ${alertsData.length} realistic cyber alerts across 10 scenarios.`);

  // Write sample files to disk for download & testing
  const sampleDir = path.resolve(__dirname, '../../../sample-data');
  if (!fs.existsSync(sampleDir)) {
    fs.mkdirSync(sampleDir, { recursive: true });
  }

  const jsonPath = path.join(sampleDir, 'alerts_sample_100.json');
  fs.writeFileSync(jsonPath, JSON.stringify(alertsData, null, 2), 'utf-8');

  // Generate CSV
  const csvHeaders = [
    'alertId',
    'timestamp',
    'sourceSystem',
    'eventType',
    'sourceIp',
    'destinationIp',
    'username',
    'hostname',
    'severity',
    'description',
    'protocol',
    'port',
    'eventCategory',
  ];
  const csvRows = alertsData.map(a =>
    [
      a.alertId,
      new Date(a.timestamp).toISOString(),
      `"${a.sourceSystem.replace(/"/g, '""')}"`,
      `"${a.eventType.replace(/"/g, '""')}"`,
      a.sourceIp,
      a.destinationIp,
      `"${a.username.replace(/"/g, '""')}"`,
      `"${a.hostname.replace(/"/g, '""')}"`,
      a.severity,
      `"${a.description.replace(/"/g, '""')}"`,
      a.protocol,
      a.port,
      `"${a.eventCategory.replace(/"/g, '""')}"`,
    ].join(',')
  );
  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const csvPath = path.join(sampleDir, 'alerts_sample_100.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log('✅ Generated sample JSON and CSV in sample-data/ directory');

  // Insert alerts into database
  await dal.insertManyAlerts(alertsData);

  // Run Correlation Engine
  console.log('⚡ Running Intelligent Correlation Engine on seeded dataset...');
  const result = await CorrelationEngine.runCorrelation(alertsData);

  // Store incidents
  await dal.setAllIncidents(result.incidents);

  // Update alerts with correlation markers
  for (const updated of result.updatedAlerts) {
    await dal.updateAlert(updated.alertId, {
      isDuplicate: updated.isDuplicate,
      duplicateCount: updated.duplicateCount,
      correlatedIncidentId: updated.correlatedIncidentId,
      status: updated.status,
    });
  }

  // Create initial audit log
  await dal.addAuditLog({
    action: 'DEMO_SEED_INITIALIZATION',
    performedBy: 'System Auto-Initializer',
    role: 'Administrator',
    details: `Processed ${result.totalAlertsProcessed} alerts -> suppressed ${result.duplicatesSuppressed} duplicates -> generated ${result.incidentsCreated} prioritized incidents (${result.efficiencyRatio})`,
    timestamp: new Date(),
  });

  console.log('🎯 Seeding & Correlation Complete!');
  console.log(`   - Raw Alerts: ${result.totalAlertsProcessed}`);
  console.log(`   - Duplicates Suppressed: ${result.duplicatesSuppressed}`);
  console.log(`   - Correlated Incidents: ${result.incidentsCreated}`);
  console.log(`   - Efficiency: ${result.efficiencyRatio}`);
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase(true)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
