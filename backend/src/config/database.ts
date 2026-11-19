import mongoose from 'mongoose';
import { config } from './env';

export let isMongoConnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB instance at:', config.mongoUri);
  } catch (err: any) {
    isMongoConnected = false;
    console.warn('⚠️  MongoDB connection failed or unavailable (' + (err?.message || 'timeout') + ').');
    console.log('⚡ Initializing High-Performance Embedded SOC Persistence Engine.');
  }
}
