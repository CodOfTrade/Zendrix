import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { randomUUID } from 'node:crypto';
import prisma from '../../prisma.js';
import { config } from '../../config.js';
import { AuthUser } from '../rbac/types.js';

export async function validateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
      }
    }
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password + config.pepper, user.passwordHash);
  if (!ok) return null;

  const permissions = new Set<string>();
  user.roles.forEach((ur) =>
    ur.role.rolePermissions.forEach((rp) => {
      permissions.add(rp.permission.key);
    })
  );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles.map((r) => r.role.name),
    permissions: Array.from(permissions)
  };
}

export function signTokens(app: any, user: AuthUser) {
  const accessToken = app.jwt.sign(user, { expiresIn: '15m' });
  const refreshToken = app.jwt.sign(user, { expiresIn: '7d', secret: config.jwtRefreshSecret });
  return { accessToken, refreshToken };
}

export async function enableTotp(userId: string) {
  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret, totpEnabled: true } });
  const uri = authenticator.keyuri(userId, 'Zendrix', secret);
  return { secret, uri };
}

export async function verifyTotp(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret) return false;
  return authenticator.verify({ token, secret: user.totpSecret });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = randomUUID();
  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    update: { token, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
    create: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 30) }
  });
  return { token };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return false;
  const hash = await bcrypt.hash(newPassword + config.pepper, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash } }),
    prisma.passwordResetToken.delete({ where: { token } })
  ]);
  return true;
}
