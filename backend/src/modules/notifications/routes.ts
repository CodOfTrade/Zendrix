import { FastifyInstance } from 'fastify';
import prisma from '../../prisma.js';

export function registerNotificationRoutes(app: FastifyInstance) {
  app.get('/notifications', { onRequest: [app.verifyAuth] }, async (req) => {
    const userId = req.user?.id as string;
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  });

  app.post('/notifications/preferences', { onRequest: [app.verifyAuth] }, async (req) => {
    const userId = req.user?.id as string;
    const body = req.body as any;
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: { emailEnabled: body.emailEnabled, inAppEnabled: body.inAppEnabled },
      create: { userId, emailEnabled: body.emailEnabled ?? true, inAppEnabled: body.inAppEnabled ?? true }
    });
  });

  app.get('/notifications/preferences', { onRequest: [app.verifyAuth] }, async (req) => {
    const userId = req.user?.id as string;
    return prisma.notificationPreference.findUnique({ where: { userId } });
  });
}
