import mongoose, { Schema } from 'mongoose';
import { IInvestigationNote } from '../types';

const InvestigationNoteSchema = new Schema<IInvestigationNote>(
  {
    noteId: { type: String, required: true, unique: true, index: true },
    incidentId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InvestigationNoteModel =
  mongoose.models.InvestigationNote || mongoose.model<IInvestigationNote>('InvestigationNote', InvestigationNoteSchema);
