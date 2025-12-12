import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { createSigeOrder } from './client.js';
import { processSigeQueue } from '../../jobs/sigeQueue.js';

export function registerSigeRoutes(app: FastifyInstance) {
  app.get('/sige/config', { onRequest: [app.verifyAuth] }, async () => {
    const cfg = await prisma.sigeConfig.findFirst({ orderBy: { createdAt: 'desc' } });
    return cfg;
  });

  app.post('/sige/config', { onRequest: [app.verifyAuth] }, async (req) => {
    const body = req.body as any;
    const cfg = await prisma.sigeConfig.create({
      data: {
        mode: body.mode || 'sandbox',
        baseUrl: body.baseUrl,
        token: body.token,
        osEndpoint: body.osEndpoint,
        osFlagField: body.osFlagField,
        retryCount: body.retryCount || 3,
        timeoutMs: body.timeoutMs || 10000
      }
    });
    return cfg;
  });

  app.post('/sige/sync', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    // Placeholder for full sync; here we just record a job entry
    await prisma.jobQueue.create({ data: { type: 'sige_sync', payload: { requestedBy: req.user?.id } } });
    return reply.send({ ok: true });
  });

  app.post('/sige/reprocess/:ticketId', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const ticketId = (req.params as any).ticketId;
    await prisma.sigeQueue.upsert({
      where: { ticketId },
      update: { status: 'pending', attempts: 0 },
      create: { ticketId, status: 'pending' }
    });
    await processSigeQueue();
    return reply.send({ ok: true });
  });

  app.get('/sige/queue', { onRequest: [app.verifyAuth] }, async () => {
    return prisma.sigeQueue.findMany({ orderBy: { updatedAt: 'desc' } });
  });

  app.post('/sige/test', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const body = req.body as any;
    const res = await createSigeOrder(body.ticketId || 'test', {
      clientExternalId: body.clientExternalId || 'client-demo',
      ticketNumber: body.ticketNumber || 0,
      title: 'Teste SIGE',
      description: 'Ping',
      solution: 'Ping',
      openedAt: new Date(),
      closedAt: new Date(),
      serviceDesk: 'Teste',
      priority: 'Normal',
      totalMinutes: 1,
      billableAmount: 0,
      noCost: true
    });
    return reply.send(res);
  });
}
