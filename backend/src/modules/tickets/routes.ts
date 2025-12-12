import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';
import { closeTicket, createTicket, transitionTicket } from './service.js';

export function registerTicketRoutes(app: FastifyInstance) {
  app.get('/tickets', { onRequest: [app.verifyAuth] }, async (req) => {
    const { q, status, serviceDeskId } = req.query as any;
    return prisma.ticket.findMany({
      where: {
        status: status,
        serviceDeskId,
        OR: q
          ? [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          : undefined
      },
      include: { stage: true, priority: true, serviceDesk: true, client: true }
    });
  });

  app.post('/tickets', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const body = req.body as any;
    try {
      const ticket = await createTicket({
        title: body.title,
        description: body.description,
        clientId: body.clientId,
        contactId: body.contactId,
        serviceDeskId: body.serviceDeskId,
        priorityId: body.priorityId,
        serviceId: body.serviceId,
        contractId: body.contractId,
        stageId: body.stageId,
        assigneeId: body.assigneeId,
        serviceGroupId: body.serviceGroupId
      });
      return reply.send(ticket);
    } catch (err: any) {
      return reply.badRequest(err.message);
    }
  });

  app.get('/tickets/:id', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: true,
        contact: true,
        stage: true,
        priority: true,
        service: true,
        comments: true,
        timeEntries: true,
        checklistItems: true,
        followers: true,
        slaState: true,
        history: true
      }
    });
    if (!ticket) return reply.notFound();
    return ticket;
  });

  app.post('/tickets/:id/stage', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    try {
      const ticket = await transitionTicket(id, body.stageId, req.user?.id);
      return reply.send(ticket);
    } catch (err: any) {
      return reply.badRequest(err.message);
    }
  });

  app.post('/tickets/:id/comment', { onRequest: [app.verifyAuth] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    return prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorId: req.user?.id,
        isPublic: body.isPublic ?? true,
        message: body.message
      }
    });
  });

  app.post('/tickets/:id/follow', { onRequest: [app.verifyAuth] }, async (req) => {
    const { id } = req.params as any;
    return prisma.ticketFollower.upsert({
      where: { ticketId_userId: { ticketId: id, userId: req.user!.id } },
      update: {},
      create: { ticketId: id, userId: req.user!.id }
    });
  });

  app.post('/tickets/:id/time', { onRequest: [app.verifyAuth] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    return prisma.ticketTimeEntry.create({
      data: {
        ticketId: id,
        userId: req.user?.id,
        minutes: body.minutes,
        notes: body.notes
      }
    });
  });

  app.post('/tickets/:id/checklist', { onRequest: [app.verifyAuth] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    return prisma.ticketChecklistItem.create({
      data: {
        ticketId: id,
        label: body.label,
        completed: body.completed ?? false
      }
    });
  });

  app.post('/tickets/:id/close', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    try {
      const ticket = await closeTicket(id, { summary: body.summary, billingNotes: body.billingNotes, sigeMode: body.sigeMode });
      return reply.send(ticket);
    } catch (err: any) {
      return reply.badRequest(err.message);
    }
  });
}
