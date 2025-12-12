import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../../prisma.js';
import { config } from '../../config.js';
import {
  enableTotp,
  requestPasswordReset,
  resetPassword,
  signTokens,
  validateUser,
  verifyTotp
} from './service.js';

export function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', { config: { rateLimit: { max: config.rateLimitMax, timeWindow: config.rateLimitWindow } } }, async (req, reply) => {
    const body = req.body as { email: string; password: string; totp?: string };
    const user = await validateUser(body.email, body.password);
    if (!user) return reply.unauthorized();
    if (await prisma.user.findFirst({ where: { id: user.id, totpEnabled: true } })) {
      const ok = await verifyTotp(user.id, body.totp || '');
      if (!ok) return reply.unauthorized('TOTP required');
    }
    const tokens = signTokens(app, user);
    return reply.send({ user, ...tokens });
  });

  app.post('/auth/refresh', async (req, reply) => {
    const body = req.body as { refreshToken: string };
    try {
      const decoded = app.jwt.verify(body.refreshToken, { secret: config.jwtRefreshSecret }) as any;
      const tokens = signTokens(app, decoded);
      return reply.send({ user: decoded, ...tokens });
    } catch {
      return reply.unauthorized();
    }
  });

  app.post('/auth/totp/enable', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const userId = (req.user as any).id;
    const data = await enableTotp(userId);
    return reply.send(data);
  });

  app.post('/auth/totp/verify', { onRequest: [app.verifyAuth] }, async (req, reply) => {
    const body = req.body as { token: string };
    const ok = await verifyTotp((req.user as any).id, body.token);
    return ok ? reply.send({ ok: true }) : reply.unauthorized();
  });

  app.post('/auth/password/reset/request', async (req, reply) => {
    const body = req.body as { email: string };
    const token = await requestPasswordReset(body.email);
    // Em produção enviar email; aqui retornamos para simplificar.
    return reply.send({ ok: true, token });
  });

  app.post('/auth/password/reset', async (req, reply) => {
    const body = req.body as { token: string; password: string };
    const ok = await resetPassword(body.token, body.password);
    return ok ? reply.send({ ok: true }) : reply.unauthorized();
  });

  app.post('/auth/register-admin', async (req, reply) => {
    const body = req.body as { email: string; password: string; name: string };
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return reply.conflict('User exists');
    const hash = await bcrypt.hash(body.password + config.pepper, 10);
    const adminRole = await prisma.role.upsert({
      where: { key: 'admin' },
      update: {},
      create: { key: 'admin', name: 'Admin' }
    });
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: hash,
        roles: {
          create: { roleId: adminRole.id }
        }
      }
    });
    return reply.send({ id: user.id });
  });
}
