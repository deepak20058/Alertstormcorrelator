import api from './api';
import { IAlert, IIncident, ICorrelationRule, IThreatIndicator } from '../types';

export const alertService = {
  getAlerts: async (params?: { page?: number; limit?: number; severity?: string; status?: string; sourceSystem?: string; search?: string }) => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },
  getAlertById: async (id: string) => {
    const res = await api.get(`/alerts/${id}`);
    return res.data;
  },
  createAlert: async (data: Partial<IAlert>) => {
    const res = await api.post('/alerts', data);
    return res.data;
  },
  uploadAlertsFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/alerts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  simulateAlerts: async (count: number = 1, override?: any) => {
    const res = await api.post('/alerts/simulate', { count, override });
    return res.data;
  },
  deleteAlert: async (id: string) => {
    const res = await api.delete(`/alerts/${id}`);
    return res.data;
  },
};

export const incidentService = {
  getIncidents: async (params?: { page?: number; limit?: number; priority?: string; status?: string; category?: string; search?: string }) => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },
  getIncidentById: async (id: string) => {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
  },
  updateIncident: async (id: string, updates: Partial<IIncident>) => {
    const res = await api.patch(`/incidents/${id}`, updates);
    return res.data;
  },
  addNote: async (incidentId: string, content: string) => {
    const res = await api.post(`/incidents/${incidentId}/notes`, { content });
    return res.data;
  },
  getCorrelatedAlerts: async (incidentId: string) => {
    const res = await api.get(`/incidents/${incidentId}/alerts`);
    return res.data;
  },
};

export const correlationService = {
  runCorrelation: async () => {
    const res = await api.post('/correlation/run');
    return res.data;
  },
  getCorrelationResults: async () => {
    const res = await api.get('/correlation/results');
    return res.data;
  },
  getRules: async () => {
    const res = await api.get('/correlation/rules');
    return res.data;
  },
  createRule: async (data: Partial<ICorrelationRule>) => {
    const res = await api.post('/correlation/rules', data);
    return res.data;
  },
  updateRule: async (ruleId: string, data: Partial<ICorrelationRule>) => {
    const res = await api.patch(`/correlation/rules/${ruleId}`, data);
    return res.data;
  },
};

export const analyticsService = {
  getOverview: async () => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
  getTrends: async () => {
    const res = await api.get('/analytics/trends');
    return res.data;
  },
  getDistribution: async () => {
    const res = await api.get('/analytics/distribution');
    return res.data;
  },
  exportCsv: (type: 'incidents' | 'alerts' = 'incidents') => {
    window.open(`/api/analytics/export?type=${type}`, '_blank');
  },
};

export const threatIntelService = {
  getIndicators: async () => {
    const res = await api.get('/threat-intelligence');
    return res.data;
  },
  getIndicatorById: async (id: string) => {
    const res = await api.get(`/threat-intelligence/${id}`);
    return res.data;
  },
  createIndicator: async (data: Partial<IThreatIndicator>) => {
    const res = await api.post('/threat-intelligence', data);
    return res.data;
  },
};

export const demoService = {
  resetDemo: async () => {
    const res = await api.post('/demo/reset');
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get('/demo/health');
    return res.data;
  },
};
