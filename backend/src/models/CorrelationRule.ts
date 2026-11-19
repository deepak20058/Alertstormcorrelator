import mongoose, { Schema } from 'mongoose';
import { ICorrelationRule } from '../types';

const CorrelationRuleSchema = new Schema<ICorrelationRule>(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    ruleType: {
      type: String,
      enum: ['DUPLICATE', 'IP_MATCH', 'TIME_WINDOW', 'ENTITY_MATCH', 'ATTACK_PATTERN', 'BEHAVIOR_SEQUENCE', 'MULTI_SOURCE'],
      required: true,
      index: true,
    },
    timeWindowMinutes: { type: Number, default: 30 },
    conditions: { type: Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], default: 'High' },
    isActive: { type: Boolean, default: true, index: true },
    createdByUser: { type: String, default: 'System' },
  },
  { timestamps: true }
);

export const CorrelationRuleModel =
  mongoose.models.CorrelationRule || mongoose.model<ICorrelationRule>('CorrelationRule', CorrelationRuleSchema);
