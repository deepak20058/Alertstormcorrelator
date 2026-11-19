import fs from 'fs';
import path from 'path';
import { IUser, IAlert, IIncident, ICorrelationRule, IInvestigationNote, IThreatIndicator, IAuditLog } from '../../types';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface IDatabaseState {
  users: IUser[];
  alerts: IAlert[];
  incidents: IIncident[];
  correlationRules: ICorrelationRule[];
  investigationNotes: IInvestigationNote[];
  threatIndicators: IThreatIndicator[];
  auditLogs: IAuditLog[];
}

const initialState: IDatabaseState = {
  users: [],
  alerts: [],
  incidents: [],
  correlationRules: [],
  investigationNotes: [],
  threatIndicators: [],
  auditLogs: [],
};

class EmbeddedStore {
  private state: IDatabaseState = { ...initialState };
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          users: parsed.users || [],
          alerts: parsed.alerts || [],
          incidents: parsed.incidents || [],
          correlationRules: parsed.correlationRules || [],
          investigationNotes: parsed.investigationNotes || [],
          threatIndicators: parsed.threatIndicators || [],
          auditLogs: parsed.auditLogs || [],
        };
      } else {
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing embedded DB store:', err);
      this.state = { ...initialState };
    }
  }

  public persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting embedded DB store:', err);
    }
  }

  public getState(): IDatabaseState {
    return this.state;
  }

  public clearAll() {
    this.state = {
      users: this.state.users, // preserve users on alert wipe if needed
      alerts: [],
      incidents: [],
      correlationRules: this.state.correlationRules,
      investigationNotes: [],
      threatIndicators: this.state.threatIndicators,
      auditLogs: [],
    };
    this.persist();
  }

  // --- Users ---
  public getUsers() { return this.state.users; }
  public findUser(filter: (u: IUser) => boolean) { return this.state.users.find(filter) || null; }
  public addUser(user: IUser) {
    this.state.users.push(user);
    this.persist();
    return user;
  }

  // --- Alerts ---
  public getAlerts() { return this.state.alerts; }
  public findAlerts(filter?: (a: IAlert) => boolean) {
    if (!filter) return [...this.state.alerts];
    return this.state.alerts.filter(filter);
  }
  public findAlert(filter: (a: IAlert) => boolean) {
    return this.state.alerts.find(filter) || null;
  }
  public addAlert(alert: IAlert) {
    this.state.alerts.unshift(alert);
    this.persist();
    return alert;
  }
  public addAlerts(alerts: IAlert[]) {
    this.state.alerts = [...alerts, ...this.state.alerts];
    this.persist();
    return alerts;
  }
  public updateAlert(idOrAlertId: string, updates: Partial<IAlert>) {
    const idx = this.state.alerts.findIndex(a => a._id === idOrAlertId || a.alertId === idOrAlertId || a.id === idOrAlertId);
    if (idx !== -1) {
      this.state.alerts[idx] = { ...this.state.alerts[idx], ...updates };
      this.persist();
      return this.state.alerts[idx];
    }
    return null;
  }
  public deleteAlert(idOrAlertId: string) {
    const lenBefore = this.state.alerts.length;
    this.state.alerts = this.state.alerts.filter(a => a._id !== idOrAlertId && a.alertId !== idOrAlertId && a.id !== idOrAlertId);
    this.persist();
    return this.state.alerts.length < lenBefore;
  }

  // --- Incidents ---
  public getIncidents() { return this.state.incidents; }
  public findIncidents(filter?: (inc: IIncident) => boolean) {
    if (!filter) return [...this.state.incidents];
    return this.state.incidents.filter(filter);
  }
  public findIncident(filter: (inc: IIncident) => boolean) {
    return this.state.incidents.find(filter) || null;
  }
  public addIncident(incident: IIncident) {
    this.state.incidents.unshift(incident);
    this.persist();
    return incident;
  }
  public setIncidents(incidents: IIncident[]) {
    this.state.incidents = incidents;
    this.persist();
  }
  public updateIncident(idOrIncidentId: string, updates: Partial<IIncident>) {
    const idx = this.state.incidents.findIndex(i => i._id === idOrIncidentId || i.incidentId === idOrIncidentId || i.id === idOrIncidentId);
    if (idx !== -1) {
      this.state.incidents[idx] = {
        ...this.state.incidents[idx],
        ...updates,
        updatedAt: new Date(),
      };
      this.persist();
      return this.state.incidents[idx];
    }
    return null;
  }

  // --- Correlation Rules ---
  public getRules() { return this.state.correlationRules; }
  public setRules(rules: ICorrelationRule[]) {
    this.state.correlationRules = rules;
    this.persist();
  }
  public addRule(rule: ICorrelationRule) {
    this.state.correlationRules.push(rule);
    this.persist();
    return rule;
  }
  public updateRule(ruleId: string, updates: Partial<ICorrelationRule>) {
    const idx = this.state.correlationRules.findIndex(r => r.ruleId === ruleId || r._id === ruleId);
    if (idx !== -1) {
      this.state.correlationRules[idx] = { ...this.state.correlationRules[idx], ...updates };
      this.persist();
      return this.state.correlationRules[idx];
    }
    return null;
  }

  // --- Notes ---
  public getNotes(incidentId?: string) {
    if (!incidentId) return this.state.investigationNotes;
    return this.state.investigationNotes.filter(n => n.incidentId === incidentId);
  }
  public addNote(note: IInvestigationNote) {
    this.state.investigationNotes.unshift(note);
    this.persist();
    return note;
  }

  // --- Threat Indicators ---
  public getThreatIndicators() { return this.state.threatIndicators; }
  public setThreatIndicators(indicators: IThreatIndicator[]) {
    this.state.threatIndicators = indicators;
    this.persist();
  }
  public addThreatIndicator(ti: IThreatIndicator) {
    this.state.threatIndicators.unshift(ti);
    this.persist();
    return ti;
  }

  // --- Audit Logs ---
  public getAuditLogs() { return this.state.auditLogs; }
  public addAuditLog(log: IAuditLog) {
    this.state.auditLogs.unshift(log);
    this.persist();
    return log;
  }
}

export const dbStore = new EmbeddedStore();
