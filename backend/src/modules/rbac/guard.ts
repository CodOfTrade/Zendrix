import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser } from './types.js';

declare module 'fastify' {
  interface FastifyInstance {
    verifyAuth(request: FastifyRequest, reply: FastifyReply, required?: string | string[]): Promise<void>;
  }
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authHook(
  this: any,
  request: FastifyRequest,
  reply: FastifyReply,
  required?: string | string[]
) {
  try {
    const decoded = await request.jwtVerify<AuthUser>();
    request.user = decoded;
    if (required) {
      const requiredList = Array.isArray(required) ? required : [required];
      const has = requiredList.every((perm) => decoded.permissions.includes(perm));
      if (!has) {
        return reply.forbidden('Missing permission');
      }
    }
  } catch (err) {
    return reply.unauthorized();
  }
}
