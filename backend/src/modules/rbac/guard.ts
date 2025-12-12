import { FastifyRequest, FastifyReply, onRequestHookHandler } from 'fastify';
import { AuthUser } from './types.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyAuth: onRequestHookHandler;
  }
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export const authHook: onRequestHookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = await request.jwtVerify<AuthUser>();
    request.user = decoded;
  } catch (err) {
    return reply.unauthorized();
  }
};
