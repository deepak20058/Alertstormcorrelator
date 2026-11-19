import mongoose, { Schema } from 'mongoose';
import { IIncident } from '../types';

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true, index: true },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true, index: true },
    riskScore: { type: Number, required: true, min: 0, max: 100, index: true },
    status: {
      type: String,
      enum: ['New', 'Investigating', 'Contained', 'Resolved', 'False Positive'],
      default: 'New',
      index: true,
    },
    category: { type: String, required: true, index: true },
    confidenceScore: { type: Number, default: 85 },
    correlationReason: { type: String, required: true },
    correlationRulesMatched: [{ type: String }],
    alertIds: [{ type: String, index: true }],
    alertCount: { type: Number, default: 0 },
    entities: {
      sourceIps: [{ type: String }],
      destIps: [{ type: String }],
      users: [{ type: String }],
      hostnames: [{ type: String }],
    },
    attackTimeline: [
      {
        timestamp: { type: Date, required: true },
        alertId: { type: String, required: true },
        eventType: { type: String, required: true },
        stage: { type: String, required: true },
        severity: { type: String, required: true },
        description: { type: String, required: true },
        sourceIp: { type: String },
        destinationIp: { type: String },
      },
    ],
    mitreMapping: [
      {
        tactic: { type: String, required: true },
        techniqueId: { type: String, required: true },
        techniqueName: { type: String, required: true },
        matchedEvidence: { type: String, required: true },
      },
    ],
    aiInvestigation: {
      summary: { type: String, required: true },
      probableAttack: { type: String, required: true },
      attackProgression: [{ type: String }],
      riskAssessment: { type: String, required: true },
      recommendedSteps: [{ type: String }],
      suggestedContainment: [{ type: String }],
      isAiGenerated: { type: Boolean, default: true },
      modelUsed: { type: String, default: 'Security-Correlation-Engine-v2' },
    },
    riskFactors: [
      {
        factor: { type: String, required: true },
        scoreImpact: { type: Number, required: true },
        description: { type: String, required: true },
      },
    ],
    assignedTo: {
      userId: { type: String },
      name: { type: String },
      email: { type: String },
      role: { type: String },
    },
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true },
  },
  { timestamps: true }
);

IncidentSchema.index({ priority: 1, status: 1 });
IncidentSchema.index({ riskScore: -1 });

export const IncidentModel = mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
