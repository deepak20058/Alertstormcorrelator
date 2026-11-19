import mongoose, { Schema } from 'mongoose';
import { IAuditLog } from '../types';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    performedBy: { type: String, required: true },
    role: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
