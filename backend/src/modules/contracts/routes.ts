import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

export function registerContractRoutes(app: FastifyInstance) {
  app.get('/contracts', { onRequest: [app.verifyAuth] }, async () => {
    return prisma.contract.findMany({ include: { client: true, sla: true, limits: true } });
  });

  app.post('/contracts', { onRequest: [app.verifyAuth] }, async (req) => {
    const body = req.body as any;
    const data: any = {
      clientId: String(body.clientId),
      name: body.name,
      type: body.type,
      status: body.status || 'active',
      startDate: body.startDate,
      endDate: body.endDate,
      reajusteBase: body.reajusteBase,
      hourlyRate: body.hourlyRate,
      managedLimit: body.managedLimit ?? 0,
      allowExceed: body.allowExceed ?? false,
      externalSource: body.externalSource,
      externalId: body.externalId,
      sla: body.sla
        ? {
            create: {
              firstResponseMins: body.sla.firstResponseMins,
              resolutionMins: body.sla.resolutionMins,
              pausesByStageIds: body.sla.pausesByStageIds || [],
              businessHoursStart: body.sla.businessHoursStart || 8,
              businessHoursEnd: body.sla.businessHoursEnd || 18,
              holidays: body.sla.holidays || []
            }
          }
        : undefined,
      limits: {
        create: {
          managedTotal: body.managedLimit ?? 0,
          allowExceed: body.allowExceed ?? false
        }
      }
    };
    return prisma.contract.create({ data });
  });

  app.put('/contracts/:id', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const { id } = req.params as any;
    const body = req.body as any;
    try {
      return await prisma.contract.update({
        where: { id },
        data: {
          name: body.name,
          status: body.status,
          startDate: body.startDate,
          endDate: body.endDate,
          hourlyRate: body.hourlyRate,
          managedLimit: body.managedLimit,
          allowExceed: body.allowExceed
        }
      });
    } catch {
      return reply.notFound();
    }
  });
}
