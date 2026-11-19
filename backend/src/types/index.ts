export type UserRole = 'Administrator' | 'Security Analyst';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'False Positive';

export interface IUser {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface IAlert {
  _id?: string;
  id?: string;
  alertId: string;
  timestamp: Date;
  sourceSystem: string;
  eventType: string;
  sourceIp: string;
  destinationIp: string;
  username: string;
  hostname: string;
  severity: AlertSeverity;
  description: string;
  protocol: string;
  port: number;
  eventCategory: string;
  rawLog?: string;
  fingerprint?: string;
  isDuplicate?: boolean;
  duplicateCount?: number;
  correlatedIncidentId?: string | null;
  status?: 'New' | 'Correlated' | 'Suppressed' | 'Closed';
  createdAt?: Date;
}

export interface IMitreTechnique {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  matchedEvidence: string;
}

export interface IAttackTimelineItem {
  timestamp: Date;
  alertId: string;
  eventType: string;
  stage: string;
  severity: AlertSeverity;
  description: string;
  sourceIp?: string;
  destinationIp?: string;
}

export interface IRiskFactor {
  factor: string;
  scoreImpact: number;
  description: string;
}

export interface IAiInvestigation {
  summary: string;
  probableAttack: string;
  attackProgression: string[];
  riskAssessment: string;
  recommendedSteps: string[];
  suggestedContainment: string[];
  isAiGenerated: boolean;
  modelUsed: string;
}

export interface IIncident {
  _id?: string;
  id?: string;
  incidentId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  priority: IncidentPriority;
  riskScore: number;
  status: IncidentStatus;
  category: string;
  confidenceScore: number;
  correlationReason: string;
  correlationRulesMatched: string[];
  alertIds: string[];
  alertCount: number;
  entities: {
    sourceIps: string[];
    destIps: string[];
    users: string[];
    hostnames: string[];
  };
  attackTimeline: IAttackTimelineItem[];
  mitreMapping: IMitreTechnique[];
  aiInvestigation: IAiInvestigation;
  riskFactors: IRiskFactor[];
  assignedTo?: {
    userId?: string;
    name: string;
    email: string;
    role: string;
  } | null;
  firstSeen: Date;
  lastSeen: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICorrelationRule {
  _id?: string;
  id?: string;
  ruleId: string;
  name: string;
  description: string;
  ruleType: 'DUPLICATE' | 'IP_MATCH' | 'TIME_WINDOW' | 'ENTITY_MATCH' | 'ATTACK_PATTERN' | 'BEHAVIOR_SEQUENCE' | 'MULTI_SOURCE';
  timeWindowMinutes: number;
  conditions: Record<string, any>;
  severity: AlertSeverity;
  isActive: boolean;
  createdByUser?: string;
}

export interface IInvestigationNote {
  _id?: string;
  id?: string;
  noteId: string;
  incidentId: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: Date;
}

export interface IThreatIndicator {
  _id?: string;
  id?: string;
  indicator: string;
  type: 'IP' | 'DOMAIN' | 'HASH';
  reputation: 'Malicious' | 'Suspicious' | 'Neutral' | 'Known Good';
  threatScore: number;
  threatCategory: string;
  associatedActors: string[];
  lastObserved: Date;
  matchedAlertCount: number;
  country?: string;
  asn?: string;
}

export interface IAuditLog {
  _id?: string;
  id?: string;
  action: string;
  performedBy: string;
  role: string;
  details: string;
  timestamp: Date;
}
