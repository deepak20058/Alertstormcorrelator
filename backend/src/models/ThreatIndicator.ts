import mongoose, { Schema } from 'mongoose';
import { IThreatIndicator } from '../types';

const ThreatIndicatorSchema = new Schema<IThreatIndicator>(
  {
    indicator: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['IP', 'DOMAIN', 'HASH'], required: true, index: true },
    reputation: { type: String, enum: ['Malicious', 'Suspicious', 'Neutral', 'Known Good'], required: true, index: true },
    threatScore: { type: Number, required: true, min: 0, max: 100 },
    threatCategory: { type: String, required: true, index: true },
    associatedActors: [{ type: String }],
    lastObserved: { type: Date, default: Date.now },
    matchedAlertCount: { type: Number, default: 0 },
    country: { type: String, default: 'Unknown' },
    asn: { type: String, default: 'Unknown' },
  },
  { timestamps: true }
);

export const ThreatIndicatorModel =
  mongoose.models.ThreatIndicator || mongoose.model<IThreatIndicator>('ThreatIndicator', ThreatIndicatorSchema);
