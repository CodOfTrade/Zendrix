import prisma from '../../prisma.js';

export async function sendNotification(opts: { userId: string; title: string; body: string }) {
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      body: opts.body
    }
  });
}
