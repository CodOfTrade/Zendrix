import prisma from '../prisma.js';
import { createSigeOrder } from '../modules/sige/client.js';

export async function processSigeQueue() {
  const items = await prisma.sigeQueue.findMany({ where: { status: { in: ['pending', 'error'] } }, take: 10 });
  for (const item of items) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: item.ticketId },
        include: {
          client: true,
          contact: true,
          serviceDesk: true,
          service: true,
          priority: true,
          timeEntries: true
        }
      });
      if (!ticket) continue;
      const totalMinutes = ticket.timeEntries.reduce((acc, te) => acc + te.minutes, 0);
      const payload = {
        clientExternalId: ticket.client.externalId || ticket.clientId,
        contactExternalId: ticket.contact?.externalId,
        ticketNumber: ticket.number,
        title: ticket.title,
        description: ticket.description,
        solution: ticket.billingNotes || 'Fechado no Zendrix',
        openedAt: ticket.createdAt,
        closedAt: ticket.closedAt || new Date(),
        serviceDesk: ticket.serviceDesk.name,
        service: ticket.service?.name,
        priority: ticket.priority.name,
        totalMinutes,
        billableAmount: Number(ticket.billableAmount),
        noCost: ticket.noCost,
        billingNotes: ticket.billingNotes || undefined
      };
      const res = await createSigeOrder(ticket.id, payload);
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { sigeOrderId: res.externalId, sigeStatus: res.status }
      });
      await prisma.sigeQueue.delete({ where: { id: item.id } });
    } catch (err: any) {
      await prisma.sigeQueue.update({
        where: { id: item.id },
        data: { status: 'error', attempts: { increment: 1 }, lastError: err?.message }
      });
    }
  }
}
