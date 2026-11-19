import { Request, Response } from 'express';
import fs from 'fs';
import csvParser from 'csv-parser';
import { dal } from '../services/db/dal';
import { normalizeRawAlert, generateFingerprint } from '../services/ingestion/normalizer';
import { socketEmitter } from '../sockets/socketHandler';
import { AlertSimulator } from '../services/simulator/alertSimulator';
import { CorrelationEngine } from '../services/correlation/engine';
import { IAlert } from '../types';

export const alertController = {
  async getAlerts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.severity && req.query.severity !== 'ALL') filter.severity = req.query.severity;
      if (req.query.status && req.query.status !== 'ALL') filter.status = req.query.status;
      if (req.query.sourceSystem && req.query.sourceSystem !== 'ALL') filter.sourceSystem = req.query.sourceSystem;
      if (req.query.search) filter.search = req.query.search;

      const { alerts, total } = await dal.getAlerts(filter, limit, skip);

      return res.json({
        success: true,
        data: alerts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err: any) {
      console.error('getAlerts error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAlertById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const alert = await dal.getAlertById(id);
      if (!alert) {
        return res.status(404).json({ success: false, message: `Alert with ID ${id} not found.` });
      }
      return res.json({ success: true, data: alert });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createAlert(req: Request, res: Response) {
    try {
      const raw = req.body;
      if (!raw.eventType) {
        return res.status(400).json({ success: false, message: 'Field eventType is mandatory.' });
      }

      const normalized = normalizeRawAlert(raw);
      const saved = await dal.createAlert(normalized);

      socketEmitter.emitNewAlert(saved);

      await dal.addAuditLog({
        action: 'MANUAL_ALERT_INGESTED',
        performedBy: (req as any).user?.username || 'Analyst',
        role: (req as any).user?.role || 'Security Analyst',
        details: `Ingested alert ${saved.alertId} (${saved.eventType}) from source ${saved.sourceIp}`,
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Alert ingested successfully.',
        data: saved,
      });
    } catch (err: any) {
      console.error('createAlert error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async uploadAlerts(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a JSON or CSV file.' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname.toLowerCase();
      let rawRecords: any[] = [];
      const errors: string[] = [];

      if (fileName.endsWith('.json')) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        try {
          const parsed = JSON.parse(fileContent);
          rawRecords = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e: any) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ success: false, message: 'Invalid JSON file: ' + e.message });
        }
      } else if (fileName.endsWith('.csv')) {
        rawRecords = await new Promise((resolve, reject) => {
          const results: any[] = [];
          fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', data => results.push(data))
            .on('end', () => resolve(results))
            .on('error', err => reject(err));
        });
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ success: false, message: 'Unsupported file format. Please upload .json or .csv' });
      }

      // Cleanup temp uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch {}

      if (rawRecords.length === 0) {
        return res.status(400).json({ success: false, message: 'Uploaded file contained 0 alert records.' });
      }

      const normalizedAlerts: IAlert[] = [];
      rawRecords.forEach((item, idx) => {
        try {
          if (!item || typeof item !== 'object') {
            errors.push(`Row ${idx + 1}: Malformed record skipped.`);
            return;
          }
          if (!item.eventType && !item.event_type && !item.name && !item.signature) {
            errors.push(`Row ${idx + 1}: Missing required event type or name.`);
            return;
          }
          normalizedAlerts.push(normalizeRawAlert(item, idx));
        } catch (err: any) {
          errors.push(`Row ${idx + 1}: Parsing failure (${err.message}).`);
        }
      });

      if (normalizedAlerts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid alert records could be processed.',
          errors,
        });
      }

      // Save to database
      await dal.insertManyAlerts(normalizedAlerts);

      // Trigger automatic correlation
      const allAlerts = await dal.getAllAlertsRaw();
      const correlationResult = await CorrelationEngine.runCorrelation(allAlerts);

      await dal.setAllIncidents(correlationResult.incidents);
      for (const updated of correlationResult.updatedAlerts) {
        await dal.updateAlert(updated.alertId, {
          isDuplicate: updated.isDuplicate,
          duplicateCount: updated.duplicateCount,
          correlatedIncidentId: updated.correlatedIncidentId,
          status: updated.status,
        });
      }

      socketEmitter.emitBulkAlerts(normalizedAlerts.length, normalizedAlerts.slice(0, 5));
      socketEmitter.emitCorrelationFinished(correlationResult);

      await dal.addAuditLog({
        action: 'FILE_UPLOAD_INGESTION',
        performedBy: (req as any).user?.username || 'Analyst',
        role: (req as any).user?.role || 'Security Analyst',
        details: `Ingested ${normalizedAlerts.length} alerts from ${req.file.originalname}. Correlation yielded ${correlationResult.incidentsCreated} incidents.`,
        timestamp: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: `Successfully ingested ${normalizedAlerts.length} alerts from ${req.file.originalname}.`,
        ingestedCount: normalizedAlerts.length,
        errorsFound: errors.length,
        sampleErrors: errors.slice(0, 5),
        correlation: {
          incidentsCreated: correlationResult.incidentsCreated,
          duplicatesSuppressed: correlationResult.duplicatesSuppressed,
          efficiency: correlationResult.efficiencyRatio,
        },
      });
    } catch (err: any) {
      console.error('uploadAlerts error:', err);
      return res.status(500).json({ success: false, message: 'Upload processing failed: ' + err.message });
    }
  },

  async simulateAlert(req: Request, res: Response) {
    try {
      const count = Math.min(50, Math.max(1, parseInt(req.body.count || '1', 10)));
      const simulated: IAlert[] = [];

      for (let i = 0; i < count; i++) {
        const alert = AlertSimulator.generateSimulatedAlert(req.body.override);
        simulated.push(alert);
      }

      await dal.insertManyAlerts(simulated);

      // Re-run correlation
      const allAlerts = await dal.getAllAlertsRaw();
      const correlationResult = await CorrelationEngine.runCorrelation(allAlerts);
      await dal.setAllIncidents(correlationResult.incidents);

      for (const updated of correlationResult.updatedAlerts) {
        await dal.updateAlert(updated.alertId, {
          isDuplicate: updated.isDuplicate,
          duplicateCount: updated.duplicateCount,
          correlatedIncidentId: updated.correlatedIncidentId,
          status: updated.status,
        });
      }

      // Emit sockets
      for (const alert of simulated) {
        socketEmitter.emitNewAlert(alert);
      }
      socketEmitter.emitCorrelationFinished(correlationResult);

      return res.json({
        success: true,
        message: `Generated ${count} simulated security alerts.`,
        data: simulated,
        correlation: {
          incidentsCreated: correlationResult.incidentsCreated,
          duplicatesSuppressed: correlationResult.duplicatesSuppressed,
          efficiency: correlationResult.efficiencyRatio,
        },
      });
    } catch (err: any) {
      console.error('simulateAlert error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await dal.deleteAlert(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Alert not found.' });
      }
      return res.json({ success: true, message: `Alert ${id} deleted.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
