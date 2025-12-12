import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../../prisma.js';
import { config } from '../../config.js';
import { AuthUser } from '../rbac/types.js';

export function registerPortalRoutes(app: FastifyInstance) {
  app.post('/portal/login', async (req, reply) => {
    const body = req.body as any;
    const contact = await prisma.contact.findFirst({
      where: { email: body.email, portalAccess: true },
      include: { client: true }
    });
    if (!contact || !contact.passwordHash) return reply.unauthorized();
    const ok = await bcrypt.compare(body.password + config.pepper, contact.passwordHash);
    if (!ok) return reply.unauthorized();
    const user: AuthUser = {
      id: contact.id,
      email: contact.email || '',
      name: contact.name,
      roles: ['portal'],
      permissions: ['portal'],
      clientIds: [contact.clientId],
      isPortal: true
    };
    const token = app.jwt.sign(user, { expiresIn: '1d' });
    return reply.send({ token, contact, client: contact.client });
  });

  app.get('/portal/tickets', async (req, reply) => {
    try {
      const decoded = await req.jwtVerify<AuthUser>();
      if (!decoded.isPortal) return reply.unauthorized();
      return prisma.ticket.findMany({
        where: { clientId: { in: decoded.clientIds }, contactId: decoded.id },
        include: { stage: true, priority: true }
      });
    } catch {
      return reply.unauthorized();
    }
  });

  app.post('/portal/tickets', async (req, reply) => {
    try {
      const decoded = await req.jwtVerify<AuthUser>();
      if (!decoded.isPortal) return reply.unauthorized();
      const body = req.body as any;
      const priority = await prisma.priority.findFirst({ where: { id: body.priorityId } });
      const stage = await prisma.stage.findFirst({ where: { serviceDeskId: body.serviceDeskId }, orderBy: { order: 'asc' } });
      if (!priority || !stage) return reply.badRequest('Mesa inválida');
      const ticket = await prisma.ticket.create({
        data: {
          title: body.title,
          description: body.description,
          clientId: body.clientId || decoded.clientIds?.[0]!,
          contactId: decoded.id,
          serviceDeskId: body.serviceDeskId,
          stageId: stage.id,
          priorityId: priority.id,
          serviceId: body.serviceId,
          billableAmount: 0,
          noCost: false
        }
      });
      return reply.send(ticket);
    } catch {
      return reply.unauthorized();
    }
  });
}
