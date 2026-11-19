import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IAlert, IIncident } from '../types';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  liveAlerts: IAlert[];
  liveIncidents: IIncident[];
  isPaused: boolean;
  togglePause: () => void;
  clearLiveStream: () => void;
  lastCorrelationResult: any | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<IAlert[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<IIncident[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [lastCorrelationResult, setLastCorrelationResult] = useState<any | null>(null);
  const { info, warning, error } = useToast();

  useEffect(() => {
    // In dev, Vite proxies /socket.io to backend
    const s = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('alert:new', (alert: IAlert) => {
      if (!isPaused) {
        setLiveAlerts(prev => [alert, ...prev.slice(0, 74)]);
      }
      if (alert.severity === 'Critical') {
        warning(`[CRITICAL ALERT] ${alert.eventType} from ${alert.sourceIp}`);
      }
    });

    s.on('incident:new', (incident: IIncident) => {
      setLiveIncidents(prev => [incident, ...prev.slice(0, 20)]);
      if (incident.priority === 'Critical') {
        error(`[NEW CRITICAL INCIDENT] ${incident.incidentId}: ${incident.title}`);
      } else {
        info(`[NEW INCIDENT] ${incident.incidentId}: ${incident.title}`);
      }
    });

    s.on('correlation:finished', (result: any) => {
      setLastCorrelationResult(result);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isPaused, warning, error, info]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const clearLiveStream = useCallback(() => {
    setLiveAlerts([]);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveAlerts,
        liveIncidents,
        isPaused,
        togglePause,
        clearLiveStream,
        lastCorrelationResult,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
