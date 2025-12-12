import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl
    }
  },
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
});

export default prisma;
