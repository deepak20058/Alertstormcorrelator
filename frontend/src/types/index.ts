export type UserRole = 'Administrator' | 'Security Analyst';

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'False Positive';

export interface IUser {
  id: string;
  _id?: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface IAlert {
  id?: string;
  _id?: string;
  alertId: string;
  timestamp: string | Date;
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
}

export interface IMitreTechnique {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  matchedEvidence: string;
}

export interface IAttackTimelineItem {
  timestamp: string | Date;
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

export interface IInvestigationNote {
  noteId: string;
  incidentId: string;
  authorName: string;
  authorRole: string;
  content: string;
  timestamp: string | Date;
}

export interface IIncident {
  id?: string;
  _id?: string;
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
  notes?: IInvestigationNote[];
  firstSeen: string | Date;
  lastSeen: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICorrelationRule {
  ruleId: string;
  name: string;
  description: string;
  ruleType: string;
  timeWindowMinutes: number;
  conditions: any;
  severity: AlertSeverity;
  isActive: boolean;
  createdByUser?: string;
}

export interface IThreatIndicator {
  indicator: string;
  type: 'IP' | 'DOMAIN' | 'HASH';
  reputation: 'Malicious' | 'Suspicious' | 'Neutral' | 'Known Good';
  threatScore: number;
  threatCategory: string;
  associatedActors: string[];
  lastObserved: string | Date;
  matchedAlertCount: number;
  country?: string;
  asn?: string;
}
