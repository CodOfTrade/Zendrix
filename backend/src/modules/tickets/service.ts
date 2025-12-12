import prisma from '../../prisma.js';
import { runAutomationActions } from '../automations/service.js';
import { createSigeOrder } from '../sige/client.js';

export async function createTicket(data: {
  title: string;
  description: string;
  clientId: string;
  contactId?: string;
  serviceDeskId: string;
  priorityId: string;
  serviceId?: string;
  contractId?: string;
  stageId: string;
  assigneeId?: string;
  serviceGroupId?: string;
}) {
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      clientId: data.clientId,
      contactId: data.contactId,
      serviceDeskId: data.serviceDeskId,
      priorityId: data.priorityId,
      serviceId: data.serviceId,
      contractId: data.contractId,
      stageId: data.stageId,
      assigneeId: data.assigneeId,
      serviceGroupId: data.serviceGroupId,
      billableAmount: 0,
      noCost: false
    },
    include: { priority: true, service: true, contract: { include: { sla: true } } }
  });

  await prisma.ticketSLAState.create({
    data: {
      ticketId: ticket.id,
      firstResponseDueAt: ticket.priority.slaMinutes
        ? new Date(Date.now() + ticket.priority.slaMinutes * 60000)
        : ticket.contract?.sla?.firstResponseMins
          ? new Date(Date.now() + ticket.contract.sla.firstResponseMins * 60000)
          : null,
      resolutionDueAt: ticket.priority.slaMinutes
        ? new Date(Date.now() + ticket.priority.slaMinutes * 60000)
        : ticket.contract?.sla?.resolutionMins
          ? new Date(Date.now() + ticket.contract.sla.resolutionMins * 60000)
          : null
    }
  });

  await prisma.ticketHistory.create({
    data: { ticketId: ticket.id, action: 'created', metadata: { by: 'system' } }
  });

  await runTicketAutomations(ticket, 'created');

  return ticket;
}

export async function transitionTicket(ticketId: string, newStageId: string, userId?: string) {
  const stage = await prisma.stage.findUnique({ where: { id: newStageId } });
  if (!stage) throw new Error('Stage not found');
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { stageId: newStageId },
    include: { slaState: true }
  });
  if (ticket.slaState) {
    if (stage.pauseSla && !ticket.slaState.pausedAt) {
      await prisma.ticketSLAState.update({
        where: { ticketId },
        data: { pausedAt: new Date() }
      });
    }
    if (!stage.pauseSla && ticket.slaState.pausedAt) {
      const minutes = Math.round((Date.now() - ticket.slaState.pausedAt.getTime()) / 60000);
      await prisma.ticketSLAState.update({
        where: { ticketId },
        data: { pausedAt: null, totalPausedMinutes: { increment: minutes } }
      });
    }
  }
  await prisma.ticketHistory.create({
    data: { ticketId, action: 'moved_stage', metadata: { newStageId, userId } }
  });
  await runTicketAutomations(ticket, 'stage_changed');
  return ticket;
}

async function calculateBilling(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { timeEntries: true, service: true, contract: true }
  });
  if (!ticket) throw new Error('Ticket not found');
  const totalMinutes = ticket.timeEntries.reduce((acc, t) => acc + t.minutes, 0);
  const hours = totalMinutes / 60;
  let noCost = false;
  let billableAmount = 0;
  let notes = ticket.billingNotes || '';

  if (ticket.contract && ticket.contract.status === 'active') {
    noCost = true;
    billableAmount = 0;
    notes = notes || `Coberto por contrato ${ticket.contract.name}`;
  } else {
    const rate = ticket.service?.hourlyRate ? Number(ticket.service.hourlyRate) : ticket.contract?.hourlyRate ? Number(ticket.contract.hourlyRate) : 150;
    billableAmount = Math.round(hours * rate * 100) / 100;
  }
  return { totalMinutes, billableAmount, noCost, notes };
}

export async function closeTicket(ticketId: string, payload: { summary: string; billingNotes?: string; sigeMode?: 'strict' | 'flexible' }) {
  const billing = await calculateBilling(ticketId);
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'closed',
      closedAt: new Date(),
      billingNotes: payload.billingNotes || billing.notes || payload.summary,
      billableAmount: billing.billableAmount,
      noCost: billing.noCost,
      sigeMode: payload.sigeMode || 'flexible'
    },
    include: {
      client: true,
      contact: true,
      serviceDesk: true,
      service: true,
      priority: true,
      timeEntries: true
    }
  });

  await prisma.ticketHistory.create({
    data: { ticketId, action: 'closed', metadata: { summary: payload.summary } }
  });

  await runTicketAutomations(ticket, 'closed');

  const totalMinutes = billing.totalMinutes;
  const sigePayload = {
    clientExternalId: ticket.client.externalId || ticket.clientId,
    contactExternalId: ticket.contact?.externalId,
    ticketNumber: ticket.number,
    title: ticket.title,
    description: ticket.description,
    solution: payload.summary,
    openedAt: ticket.createdAt,
    closedAt: ticket.closedAt || new Date(),
    serviceDesk: ticket.serviceDesk.name,
    service: ticket.service?.name,
    priority: ticket.priority.name,
    totalMinutes,
    billableAmount: billing.billableAmount,
    noCost: billing.noCost,
    billingNotes: ticket.billingNotes || payload.billingNotes
  };

  try {
    const res = await createSigeOrder(ticket.id, sigePayload);
    await prisma.ticket.update({ where: { id: ticket.id }, data: { sigeOrderId: res.externalId, sigeStatus: res.status } });
  } catch (err: any) {
    await prisma.sigeQueue.upsert({
      where: { ticketId: ticket.id },
      update: { status: 'pending', attempts: 0, lastError: err.message },
      create: { ticketId: ticket.id, status: ticket.sigeMode === 'strict' ? 'error' : 'pending', lastError: err.message }
    });
    if (ticket.sigeMode === 'strict') {
      throw new Error('Falha ao criar OS no SIGE');
    }
  }

  return ticket;
}

async function runTicketAutomations(ticket: any, event: string) {
  const automations = await prisma.automation.findMany({
    where: {
      active: true,
      OR: [{ serviceDeskId: ticket.serviceDeskId }, { serviceDeskId: null }]
    }
  });
  for (const automation of automations) {
    const trigger = automation.trigger as any;
    if (trigger?.event === event) {
      await runAutomationActions(automation.actions as any[], { ticketId: ticket.id });
    }
  }
}
