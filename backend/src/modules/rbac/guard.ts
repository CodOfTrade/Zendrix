import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser } from './types.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<AuthUser>();
    request.user = decoded;
  } catch (err) {
    return reply.unauthorized();
  }
}
