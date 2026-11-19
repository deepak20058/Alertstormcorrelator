import { Request, Response } from 'express';
import { dal } from '../services/db/dal';
import { socketEmitter } from '../sockets/socketHandler';
import { IInvestigationNote } from '../types';

export const incidentController = {
  async getIncidents(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 25;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.priority && req.query.priority !== 'ALL') filter.priority = req.query.priority;
      if (req.query.status && req.query.status !== 'ALL') filter.status = req.query.status;
      if (req.query.category && req.query.category !== 'ALL') filter.category = req.query.category;
      if (req.query.search) filter.search = req.query.search;

      const { incidents, total } = await dal.getIncidents(filter, limit, skip);

      return res.json({
        success: true,
        data: incidents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err: any) {
      console.error('getIncidents error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getIncidentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incident = await dal.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ success: false, message: `Incident ${id} not found.` });
      }

      const notes = await dal.getNotesForIncident(incident.incidentId);

      return res.json({
        success: true,
        data: {
          ...incident,
          notes,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await dal.updateIncident(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: `Incident ${id} not found.` });
      }

      socketEmitter.emitUpdatedIncident(updated);

      await dal.addAuditLog({
        action: 'INCIDENT_MODIFIED',
        performedBy: (req as any).user?.username || 'Analyst',
        role: (req as any).user?.role || 'Security Analyst',
        details: `Incident ${updated.incidentId} updated (Status: ${updated.status}, Priority: ${updated.priority})`,
        timestamp: new Date(),
      });

      return res.json({
        success: true,
        message: 'Incident updated successfully.',
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async addNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Note content cannot be empty.' });
      }

      const incident = await dal.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ success: false, message: `Incident ${id} not found.` });
      }

      const note: IInvestigationNote = {
        noteId: `NOTE-${Date.now().toString().slice(-6)}`,
        incidentId: incident.incidentId,
        authorName: (req as any).user?.name || (req as any).user?.username || 'Security Analyst',
        authorRole: (req as any).user?.role || 'Security Analyst',
        content: content.trim(),
        timestamp: new Date(),
      };

      const savedNote = await dal.addNote(note);

      await dal.addAuditLog({
        action: 'INVESTIGATION_NOTE_ADDED',
        performedBy: (req as any).user?.username || 'Analyst',
        role: (req as any).user?.role || 'Security Analyst',
        details: `Added investigation note to incident ${incident.incidentId}: "${content.slice(0, 40)}..."`,
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Note added successfully.',
        data: savedNote,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getCorrelatedAlerts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const incident = await dal.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ success: false, message: `Incident ${id} not found.` });
      }

      const allAlerts = await dal.getAllAlertsRaw();
      const alertIdSet = new Set(incident.alertIds);
      const matched = allAlerts.filter(a => alertIdSet.has(a.alertId));

      return res.json({
        success: true,
        incidentId: incident.incidentId,
        count: matched.length,
        data: matched,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
