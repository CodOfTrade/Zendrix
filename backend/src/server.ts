import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerClientRoutes } from './modules/clients/routes.js';
import { registerTicketRoutes } from './modules/tickets/routes.js';
import { registerContractRoutes } from './modules/contracts/routes.js';
import { registerAssetRoutes } from './modules/assets/routes.js';
import { registerAutomationRoutes } from './modules/automations/routes.js';
import { registerAgendaRoutes } from './modules/agenda/routes.js';
import { registerNotificationRoutes } from './modules/notifications/routes.js';
import { registerSigeRoutes } from './modules/sige/routes.js';
import { registerPortalRoutes } from './modules/portal/routes.js';
import { authHook } from './modules/rbac/guard.js';

export const buildServer = () => {
  const app = Fastify({
    logger: {
      transport: config.env === 'development' ? { target: 'pino-pretty' } : undefined
    }
  });

  app.register(sensible);
  app.register(cors, { origin: config.frontendUrl, credentials: true });
  app.register(formbody);
  app.register(rateLimit, { max: config.rateLimitMax, timeWindow: config.rateLimitWindow });
  app.register(jwt, { secret: config.jwtSecret });

  app.decorate('verifyAuth', authHook);

  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/api/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async () => ({ status: 'ready' }));

  app.register(async (api) => {
    registerAuthRoutes(api);
    registerClientRoutes(api);
    registerContractRoutes(api);
    registerTicketRoutes(api);
    registerAssetRoutes(api);
    registerAutomationRoutes(api);
    registerAgendaRoutes(api);
    registerNotificationRoutes(api);
    registerSigeRoutes(api);
    registerPortalRoutes(api);
  }, { prefix: '/api' });

  return app;
};
