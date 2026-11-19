import { Request, Response } from 'express';
import { dal } from '../services/db/dal';

export const threatIntelController = {
  async getIndicators(req: Request, res: Response) {
    try {
      const indicators = await dal.getThreatIndicators();
      return res.json({ success: true, count: indicators.length, data: indicators });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getIndicatorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const indicators = await dal.getThreatIndicators();
      const found = indicators.find(i => i.indicator === id || i._id === id || i.id === id);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Indicator not found in threat catalog.' });
      }
      return res.json({ success: true, data: found });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createIndicator(req: Request, res: Response) {
    try {
      const { indicator, type, reputation, threatScore, threatCategory, associatedActors, country, asn } = req.body;
      if (!indicator || !type) {
        return res.status(400).json({ success: false, message: 'Indicator value and type are required.' });
      }

      const created = await dal.addThreatIndicator({
        indicator,
        type: type || 'IP',
        reputation: reputation || 'Suspicious',
        threatScore: parseInt(threatScore || '75', 10),
        threatCategory: threatCategory || 'Suspicious Infrastructure',
        associatedActors: associatedActors || [],
        lastObserved: new Date(),
        matchedAlertCount: 0,
        country: country || 'US',
        asn: asn || 'AS-UNKNOWN',
      });

      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
