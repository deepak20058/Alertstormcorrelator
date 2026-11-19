import { Request, Response } from 'express';
import { dal } from '../services/db/dal';
import { CorrelationEngine } from '../services/correlation/engine';
import { socketEmitter } from '../sockets/socketHandler';
import { defaultCorrelationRules } from '../services/correlation/rules';

export const correlationController = {
  async runCorrelation(req: Request, res: Response) {
    try {
      const allAlerts = await dal.getAllAlertsRaw();
      const result = await CorrelationEngine.runCorrelation(allAlerts);

      // Persist incidents
      await dal.setAllIncidents(result.incidents);

      // Update alerts
      for (const updated of result.updatedAlerts) {
        await dal.updateAlert(updated.alertId, {
          isDuplicate: updated.isDuplicate,
          duplicateCount: updated.duplicateCount,
          correlatedIncidentId: updated.correlatedIncidentId,
          status: updated.status,
        });
      }

      socketEmitter.emitCorrelationFinished(result);

      await dal.addAuditLog({
        action: 'CORRELATION_ENGINE_RUN',
        performedBy: (req as any).user?.username || 'Analyst',
        role: (req as any).user?.role || 'Administrator',
        details: `Correlated ${result.totalAlertsProcessed} alerts into ${result.incidentsCreated} incidents with ${result.duplicatesSuppressed} duplicates suppressed.`,
        timestamp: new Date(),
      });

      return res.json({
        success: true,
        message: 'Correlation engine executed successfully.',
        data: result,
      });
    } catch (err: any) {
      console.error('runCorrelation error:', err);
      return res.status(500).json({ success: false, message: 'Correlation failed: ' + err.message });
    }
  },

  async getCorrelationResults(req: Request, res: Response) {
    try {
      const allAlerts = await dal.getAllAlertsRaw();
      const { incidents } = await dal.getIncidents({}, 500, 0);
      const rules = await dal.getRules();

      const duplicates = allAlerts.filter(a => a.isDuplicate || (a.duplicateCount || 0) > 0);
      const totalDuplicatesCount = allAlerts.reduce((acc, a) => acc + (a.duplicateCount || 0), 0);

      const rawCount = allAlerts.length;
      const incCount = incidents.length;
      const reductionPercent = rawCount > 0 ? Math.round(((rawCount - incCount) / rawCount) * 100) : 0;

      return res.json({
        success: true,
        data: {
          totalAlerts: rawCount,
          duplicatesDetected: duplicates.length,
          totalDuplicateInstancesSuppressed: totalDuplicatesCount,
          incidentsCount: incCount,
          efficiencyReduction: `${reductionPercent}%`,
          activeRulesCount: rules.filter(r => r.isActive).length,
          totalRulesCount: rules.length,
          rules,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getRules(req: Request, res: Response) {
    try {
      let rules = await dal.getRules();
      if (rules.length === 0) {
        await dal.setAllRules(defaultCorrelationRules);
        rules = defaultCorrelationRules;
      }
      return res.json({ success: true, data: rules });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createRule(req: Request, res: Response) {
    try {
      const { name, description, ruleType, timeWindowMinutes, conditions, severity } = req.body;
      if (!name || !ruleType) {
        return res.status(400).json({ success: false, message: 'Rule name and type are required.' });
      }

      const ruleId = `RULE-CUSTOM-${Date.now().toString().slice(-4)}`;
      const created = await dal.createRule({
        ruleId,
        name,
        description: description || `Custom correlation rule for ${ruleType}`,
        ruleType,
        timeWindowMinutes: parseInt(timeWindowMinutes || '30', 10),
        conditions: conditions || {},
        severity: severity || 'High',
        isActive: true,
        createdByUser: (req as any).user?.username || 'Administrator',
      });

      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateRule(req: Request, res: Response) {
    try {
      const { ruleId } = req.params;
      const updates = req.body;
      const updated = await dal.updateRule(ruleId, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Rule not found.' });
      }
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
