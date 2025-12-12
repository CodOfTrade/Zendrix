import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { runAutomationActions } from './service.js';

export function registerAutomationRoutes(app: FastifyInstance) {
  app.get('/automations', { onRequest: [app.verifyAuth] }, async () => {
    return prisma.automation.findMany();
  });

  app.post('/automations', { onRequest: [app.verifyAuth] }, async (req) => {
    const body = req.body as any;
    return prisma.automation.create({
      data: {
        serviceDeskId: body.serviceDeskId,
        name: body.name,
        active: body.active ?? true,
        trigger: body.trigger,
        actions: body.actions
      }
    });
  });

  app.post('/automations/test', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const body = req.body as any;
    await runAutomationActions(body.actions || [], { sample: true });
    return reply.send({ ok: true });
  });
}
