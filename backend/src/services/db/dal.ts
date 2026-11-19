import mongoose from 'mongoose';
import { isMongoConnected } from '../../config/database';
import { dbStore } from './store';
import { UserModel } from '../../models/User';
import { AlertModel } from '../../models/Alert';
import { IncidentModel } from '../../models/Incident';
import { CorrelationRuleModel } from '../../models/CorrelationRule';
import { InvestigationNoteModel } from '../../models/InvestigationNote';
import { ThreatIndicatorModel } from '../../models/ThreatIndicator';
import { AuditLogModel } from '../../models/AuditLog';
import { IUser, IAlert, IIncident, ICorrelationRule, IInvestigationNote, IThreatIndicator, IAuditLog } from '../../types';

export const dal = {
  // --- USERS ---
  async findUserByUsername(username: string): Promise<IUser | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await UserModel.findOne({ username }).lean()) as unknown as IUser | null;
    }
    return dbStore.findUser(u => u.username.toLowerCase() === username.toLowerCase());
  },

  async findUserByEmail(email: string): Promise<IUser | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await UserModel.findOne({ email }).lean()) as unknown as IUser | null;
    }
    return dbStore.findUser(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async findUserById(id: string): Promise<IUser | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await UserModel.findById(id).lean()) as unknown as IUser | null;
    }
    return dbStore.findUser(u => u.id === id || u._id === id);
  },

  async createUser(user: IUser): Promise<IUser> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await UserModel.create(user);
      return doc.toObject() as unknown as IUser;
    }
    const created = { ...user, _id: user._id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
    return dbStore.addUser(created);
  },

  async getAllUsers(): Promise<IUser[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await UserModel.find().select('-passwordHash').lean()) as unknown as IUser[];
    }
    return dbStore.getUsers().map(u => {
      const { passwordHash, ...rest } = u;
      return rest as IUser;
    });
  },

  // --- ALERTS ---
  async getAlerts(filter: any = {}, limit = 100, skip = 0): Promise<{ alerts: IAlert[]; total: number }> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const query: any = {};
      if (filter.severity) query.severity = filter.severity;
      if (filter.status) query.status = filter.status;
      if (filter.sourceSystem) query.sourceSystem = filter.sourceSystem;
      if (filter.search) {
        query.$or = [
          { alertId: { $regex: filter.search, $options: 'i' } },
          { eventType: { $regex: filter.search, $options: 'i' } },
          { sourceIp: { $regex: filter.search, $options: 'i' } },
          { destinationIp: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { username: { $regex: filter.search, $options: 'i' } },
        ];
      }
      const total = await AlertModel.countDocuments(query);
      const alerts = (await AlertModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean()) as unknown as IAlert[];
      return { alerts, total };
    }

    let all = dbStore.getAlerts();
    if (filter.severity) all = all.filter(a => a.severity === filter.severity);
    if (filter.status) all = all.filter(a => a.status === filter.status);
    if (filter.sourceSystem) all = all.filter(a => a.sourceSystem === filter.sourceSystem);
    if (filter.search) {
      const s = filter.search.toLowerCase();
      all = all.filter(
        a =>
          a.alertId?.toLowerCase().includes(s) ||
          a.eventType?.toLowerCase().includes(s) ||
          a.sourceIp?.toLowerCase().includes(s) ||
          a.destinationIp?.toLowerCase().includes(s) ||
          a.description?.toLowerCase().includes(s) ||
          a.username?.toLowerCase().includes(s)
      );
    }
    // Sort descending by timestamp
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const total = all.length;
    const paginated = all.slice(skip, skip + limit);
    return { alerts: paginated, total };
  },

  async getAllAlertsRaw(): Promise<IAlert[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await AlertModel.find().lean()) as unknown as IAlert[];
    }
    return dbStore.getAlerts();
  },

  async getAlertById(idOrAlertId: string): Promise<IAlert | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrAlertId);
      const query = isObjectId ? { $or: [{ _id: idOrAlertId }, { alertId: idOrAlertId }] } : { alertId: idOrAlertId };
      return (await AlertModel.findOne(query).lean()) as unknown as IAlert | null;
    }
    return dbStore.findAlert(a => a.alertId === idOrAlertId || a._id === idOrAlertId || a.id === idOrAlertId);
  },

  async createAlert(alert: IAlert): Promise<IAlert> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await AlertModel.create(alert);
      return doc.toObject() as unknown as IAlert;
    }
    const created = { ...alert, _id: alert._id || 'alt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
    return dbStore.addAlert(created);
  },

  async insertManyAlerts(alerts: IAlert[]): Promise<IAlert[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const docs = await AlertModel.insertMany(alerts, { ordered: false });
      return docs.map(d => d.toObject() as unknown as IAlert);
    }
    const withIds = alerts.map((a, i) => ({
      ...a,
      _id: a._id || `alt_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
    }));
    return dbStore.addAlerts(withIds);
  },

  async updateAlert(idOrAlertId: string, updates: Partial<IAlert>): Promise<IAlert | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrAlertId);
      const query = isObjectId ? { $or: [{ _id: idOrAlertId }, { alertId: idOrAlertId }] } : { alertId: idOrAlertId };
      return (await AlertModel.findOneAndUpdate(query, updates, { new: true }).lean()) as unknown as IAlert | null;
    }
    return dbStore.updateAlert(idOrAlertId, updates);
  },

  async deleteAlert(idOrAlertId: string): Promise<boolean> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrAlertId);
      const query = isObjectId ? { $or: [{ _id: idOrAlertId }, { alertId: idOrAlertId }] } : { alertId: idOrAlertId };
      const res = await AlertModel.deleteOne(query);
      return (res.deletedCount || 0) > 0;
    }
    return dbStore.deleteAlert(idOrAlertId);
  },

  async clearAllAlertsAndIncidents(): Promise<void> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      await AlertModel.deleteMany({});
      await IncidentModel.deleteMany({});
      await InvestigationNoteModel.deleteMany({});
      await AuditLogModel.deleteMany({});
    }
    dbStore.clearAll();
  },

  // --- INCIDENTS ---
  async getIncidents(filter: any = {}, limit = 50, skip = 0): Promise<{ incidents: IIncident[]; total: number }> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const query: any = {};
      if (filter.priority) query.priority = filter.priority;
      if (filter.status) query.status = filter.status;
      if (filter.category) query.category = filter.category;
      if (filter.search) {
        query.$or = [
          { incidentId: { $regex: filter.search, $options: 'i' } },
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { category: { $regex: filter.search, $options: 'i' } },
        ];
      }
      const total = await IncidentModel.countDocuments(query);
      const incidents = (await IncidentModel.find(query)
        .sort({ riskScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()) as unknown as IIncident[];
      return { incidents, total };
    }

    let all = dbStore.getIncidents();
    if (filter.priority) all = all.filter(i => i.priority === filter.priority);
    if (filter.status) all = all.filter(i => i.status === filter.status);
    if (filter.category) all = all.filter(i => i.category === filter.category);
    if (filter.search) {
      const s = filter.search.toLowerCase();
      all = all.filter(
        i =>
          i.incidentId?.toLowerCase().includes(s) ||
          i.title?.toLowerCase().includes(s) ||
          i.description?.toLowerCase().includes(s) ||
          i.category?.toLowerCase().includes(s)
      );
    }
    all.sort((a, b) => b.riskScore - a.riskScore);
    const total = all.length;
    return { incidents: all.slice(skip, skip + limit), total };
  },

  async getIncidentById(idOrIncidentId: string): Promise<IIncident | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrIncidentId);
      const query = isObjectId ? { $or: [{ _id: idOrIncidentId }, { incidentId: idOrIncidentId }] } : { incidentId: idOrIncidentId };
      return (await IncidentModel.findOne(query).lean()) as unknown as IIncident | null;
    }
    return dbStore.findIncident(i => i.incidentId === idOrIncidentId || i._id === idOrIncidentId || i.id === idOrIncidentId);
  },

  async createIncident(incident: IIncident): Promise<IIncident> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await IncidentModel.create(incident);
      return doc.toObject() as unknown as IIncident;
    }
    const created = {
      ...incident,
      _id: incident._id || 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: incident.createdAt || new Date(),
      updatedAt: new Date(),
    };
    return dbStore.addIncident(created);
  },

  async setAllIncidents(incidents: IIncident[]): Promise<void> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      await IncidentModel.deleteMany({});
      await IncidentModel.insertMany(incidents);
      return;
    }
    dbStore.setIncidents(incidents);
  },

  async updateIncident(idOrIncidentId: string, updates: Partial<IIncident>): Promise<IIncident | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrIncidentId);
      const query = isObjectId ? { $or: [{ _id: idOrIncidentId }, { incidentId: idOrIncidentId }] } : { incidentId: idOrIncidentId };
      return (await IncidentModel.findOneAndUpdate(query, { ...updates, updatedAt: new Date() }, { new: true }).lean()) as unknown as IIncident | null;
    }
    return dbStore.updateIncident(idOrIncidentId, updates);
  },

  // --- CORRELATION RULES ---
  async getRules(): Promise<ICorrelationRule[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await CorrelationRuleModel.find().lean()) as unknown as ICorrelationRule[];
    }
    return dbStore.getRules();
  },

  async createRule(rule: ICorrelationRule): Promise<ICorrelationRule> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await CorrelationRuleModel.create(rule);
      return doc.toObject() as unknown as ICorrelationRule;
    }
    return dbStore.addRule(rule);
  },

  async setAllRules(rules: ICorrelationRule[]): Promise<void> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      await CorrelationRuleModel.deleteMany({});
      await CorrelationRuleModel.insertMany(rules);
      return;
    }
    dbStore.setRules(rules);
  },

  async updateRule(ruleId: string, updates: Partial<ICorrelationRule>): Promise<ICorrelationRule | null> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await CorrelationRuleModel.findOneAndUpdate({ ruleId }, updates, { new: true }).lean()) as unknown as ICorrelationRule | null;
    }
    return dbStore.updateRule(ruleId, updates);
  },

  // --- INVESTIGATION NOTES ---
  async getNotesForIncident(incidentId: string): Promise<IInvestigationNote[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await InvestigationNoteModel.find({ incidentId }).sort({ timestamp: -1 }).lean()) as unknown as IInvestigationNote[];
    }
    return dbStore.getNotes(incidentId);
  },

  async addNote(note: IInvestigationNote): Promise<IInvestigationNote> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await InvestigationNoteModel.create(note);
      return doc.toObject() as unknown as IInvestigationNote;
    }
    return dbStore.addNote(note);
  },

  // --- THREAT INDICATORS ---
  async getThreatIndicators(): Promise<IThreatIndicator[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await ThreatIndicatorModel.find().sort({ threatScore: -1 }).lean()) as unknown as IThreatIndicator[];
    }
    return dbStore.getThreatIndicators();
  },

  async setThreatIndicators(indicators: IThreatIndicator[]): Promise<void> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      await ThreatIndicatorModel.deleteMany({});
      await ThreatIndicatorModel.insertMany(indicators);
      return;
    }
    dbStore.setThreatIndicators(indicators);
  },

  async addThreatIndicator(ti: IThreatIndicator): Promise<IThreatIndicator> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await ThreatIndicatorModel.create(ti);
      return doc.toObject() as unknown as IThreatIndicator;
    }
    return dbStore.addThreatIndicator(ti);
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(limit = 100): Promise<IAuditLog[]> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      return (await AuditLogModel.find().sort({ timestamp: -1 }).limit(limit).lean()) as unknown as IAuditLog[];
    }
    return dbStore.getAuditLogs().slice(0, limit);
  },

  async addAuditLog(log: IAuditLog): Promise<IAuditLog> {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const doc = await AuditLogModel.create(log);
      return doc.toObject() as unknown as IAuditLog;
    }
    return dbStore.addAuditLog(log);
  },
};
