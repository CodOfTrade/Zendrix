import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

export function registerClientRoutes(app: FastifyInstance) {
  app.get('/clients', { onRequest: [app.verifyAuth] }, async (req) => {
    const { q } = req.query as any;
    return prisma.client.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      include: { contacts: true, contracts: true }
    });
  });

  app.post('/clients', { onRequest: [app.verifyAuth] }, async (req) => {
    const body = req.body as any;
    return prisma.client.create({
      data: {
        name: body.name,
        document: body.document,
        tags: body.tags || [],
        externalSource: body.externalSource,
        externalId: body.externalId
      }
    });
  });

  app.get('/clients/:id', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const client = await prisma.client.findUnique({
      where: { id },
      include: { contacts: true, contracts: true, assets: true }
    });
    if (!client) return reply.notFound();
    return client;
  });

  app.put('/clients/:id', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    try {
      return await prisma.client.update({
        where: { id },
        data: {
          name: body.name,
          document: body.document,
          tags: body.tags,
          externalSource: body.externalSource,
          externalId: body.externalId
        }
      });
    } catch {
      return reply.notFound();
    }
  });

  app.post('/clients/:id/contacts', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return reply.notFound();
    return prisma.contact.create({
      data: {
        clientId: id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        portalAccess: body.portalAccess ?? false,
        externalSource: body.externalSource,
        externalId: body.externalId
      }
    });
  });
}
