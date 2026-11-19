import mongoose, { Schema } from 'mongoose';
import { IAlert } from '../types';

const AlertSchema = new Schema<IAlert>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    sourceSystem: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    sourceIp: { type: String, required: true, index: true },
    destinationIp: { type: String, required: true, index: true },
    username: { type: String, default: '', index: true },
    hostname: { type: String, default: '', index: true },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], required: true, index: true },
    description: { type: String, required: true },
    protocol: { type: String, default: 'TCP' },
    port: { type: Number, default: 0 },
    eventCategory: { type: String, required: true, index: true },
    rawLog: { type: String, default: '' },
    fingerprint: { type: String, index: true },
    isDuplicate: { type: Boolean, default: false, index: true },
    duplicateCount: { type: Number, default: 0 },
    correlatedIncidentId: { type: String, default: null, index: true },
    status: { type: String, enum: ['New', 'Correlated', 'Suppressed', 'Closed'], default: 'New', index: true },
  },
  { timestamps: true }
);

AlertSchema.index({ sourceIp: 1, destinationIp: 1, timestamp: -1 });
AlertSchema.index({ eventType: 1, sourceIp: 1 });

export const AlertModel = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
