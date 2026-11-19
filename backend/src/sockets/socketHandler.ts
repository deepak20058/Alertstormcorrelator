import { Server as SocketIOServer, Socket } from 'socket.io';
import { IAlert, IIncident } from '../types';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 SOC Live Monitoring client connected: ${socket.id}`);

    socket.emit('monitoring:status', {
      connected: true,
      timestamp: new Date(),
      message: 'Connected to AlertStorm Real-Time Correlation Feed',
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

export const socketEmitter = {
  emitNewAlert(alert: IAlert) {
    if (ioInstance) {
      ioInstance.emit('alert:new', alert);
    }
  },

  emitBulkAlerts(count: number, sample?: IAlert[]) {
    if (ioInstance) {
      ioInstance.emit('alerts:bulk_ingested', { count, sample: sample || [] });
    }
  },

  emitNewIncident(incident: IIncident) {
    if (ioInstance) {
      ioInstance.emit('incident:new', incident);
    }
  },

  emitUpdatedIncident(incident: IIncident) {
    if (ioInstance) {
      ioInstance.emit('incident:updated', incident);
    }
  },

  emitCorrelationFinished(result: any) {
    if (ioInstance) {
      ioInstance.emit('correlation:finished', result);
    }
  },

  emitStatsUpdate(stats: any) {
    if (ioInstance) {
      ioInstance.emit('stats:updated', stats);
    }
  },
};
