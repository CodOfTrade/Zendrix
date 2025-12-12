import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

async function assertManagedLimit(contractId: string | null, clientId: string) {
  if (!contractId) return;
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { limits: true }
  });
  if (!contract || !contract.limits) return;
  const managedCount = await prisma.asset.count({ where: { contractId, managed: true } });
  if (managedCount >= contract.limits.managedTotal && !contract.limits.allowExceed) {
    throw new Error('Limite de gerenciados excedido');
  }
}

export function registerAssetRoutes(app: FastifyInstance) {
  app.get('/assets', { onRequest: [app.verifyAuth] }, async (req) => {
    const { clientId } = req.query as any;
    return prisma.asset.findMany({
      where: clientId ? { clientId } : undefined
    });
  });

  app.post('/assets', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const body = req.body as any;
    try {
      await assertManagedLimit(body.contractId || null, body.clientId);
      return await prisma.asset.create({
        data: {
          clientId: body.clientId,
          contractId: body.contractId,
          type: body.type,
          manufacturer: body.manufacturer,
          model: body.model,
          serial: body.serial,
          serviceTag: body.serviceTag,
          managed: body.managed ?? false,
          location: body.location,
          status: body.status,
          notes: body.notes
        }
      });
    } catch (err: any) {
      return reply.badRequest(err.message);
    }
  });
}
