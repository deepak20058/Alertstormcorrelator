import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { initSocketIO } from './sockets/socketHandler';
import { dal } from './services/db/dal';
import { seedDatabase } from './utils/seedData';

async function startServer() {
  try {
    console.log('🚀 Initializing AlertStormCorrelator SOC Platform...');
    await connectDatabase();

    // Check if initial seeding is needed
    const existingUsers = await dal.getAllUsers();
    const existingAlerts = await dal.getAllAlertsRaw();

    if (existingUsers.length === 0 || existingAlerts.length === 0) {
      console.log('📦 Database empty: executing automated seeding of 100+ cybersecurity alerts and accounts...');
      await seedDatabase(false);
    } else {
      console.log(`✅ Loaded existing dataset (${existingAlerts.length} alerts in store).`);
    }

    const app = createApp();
    const server = http.createServer(app);

    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
    });

    initSocketIO(io);

    server.listen(config.port, () => {
      console.log('================================================================');
      console.log(`🛡️  AlertStormCorrelator Server running on http://localhost:${config.port}`);
      console.log(`🌐 Socket.IO Real-Time Stream listening for SOC clients`);
      console.log(`🔑 Demo Login Credentials:`);
      console.log(`   - Administrator: admin@alertstorm.io / Admin@12345`);
      console.log(`   - Security Analyst: analyst@alertstorm.io / Analyst@12345`);
      console.log('================================================================');
    });
  } catch (err: any) {
    console.error('Fatal server startup failure:', err);
    process.exit(1);
  }
}

startServer();
