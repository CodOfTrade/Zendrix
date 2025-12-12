import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

export function registerAgendaRoutes(app: FastifyInstance) {
  app.get('/agenda', { onRequest: [app.verifyAuth] }, async (req) => {
    const { from, to } = req.query as any;
    return prisma.appointment.findMany({
      where: {
        startAt: from && to ? { gte: new Date(from), lte: new Date(to) } : undefined
      },
      include: { participants: true }
    });
  });

  app.post('/agenda', { onRequest: [app.verifyAuth] }, async (req) => {
    const body = req.body as any;
    return prisma.appointment.create({
      data: {
        title: body.title,
        description: body.description,
        startAt: body.startAt,
        endAt: body.endAt,
        recurrence: body.recurrence,
        ticketId: body.ticketId,
        clientId: body.clientId,
        createdById: req.user?.id,
        reminderMins: body.reminderMins
      }
    });
  });
}
