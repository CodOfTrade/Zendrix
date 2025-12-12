import { buildServer } from './server.js';
import { config } from './config.js';
import prisma from './prisma.js';
import { processSigeQueue } from './jobs/sigeQueue.js';

const start = async () => {
  const app = buildServer();

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // Worker simples em memória para fila SIGE.
  setInterval(() => {
    processSigeQueue().catch((err) => app.log.error(err));
  }, 15000);

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server listening on ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
