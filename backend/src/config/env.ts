import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alertstorm',
  jwtSecret: process.env.JWT_SECRET || 'alertstorm-cybersecurity-secret-key-soc-2026-super-secure',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  aiProvider: process.env.AI_PROVIDER || 'local',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
