import prisma from '../../prisma.js';
import { config } from '../../config.js';
import { Prisma } from '@prisma/client';

export interface SigeOrderPayload {
  clientExternalId: string;
  contactExternalId?: string;
  ticketNumber: number;
  title: string;
  description: string;
  solution: string;
  openedAt: Date;
  closedAt: Date;
  serviceDesk: string;
  service?: string;
  priority: string;
  totalMinutes: number;
  billableAmount: number;
  noCost: boolean;
  billingNotes?: string;
}

export async function createSigeOrder(ticketId: string, payload: SigeOrderPayload) {
  if (config.sige.mode === 'mock') {
    const externalId = `mock-os-${payload.ticketNumber}`;
    await prisma.sigeLog.create({
      data: {
        ticketId,
        payload: payload as Prisma.InputJsonValue,
        response: { externalId },
        status: 'mock'
      }
    });
    return { externalId, status: 'mock' };
  }

  const sigeConfig = await prisma.sigeConfig.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  const baseUrl = sigeConfig?.baseUrl || config.sige.baseUrl;
  const endpoint = sigeConfig?.osEndpoint || config.sige.osEndpoint;
  const flagField = sigeConfig?.osFlagField || config.sige.osFlagField;
  const url = `${baseUrl}${endpoint}`;
  const body: any = {
    customer_id: payload.clientExternalId,
    contact_id: payload.contactExternalId,
    reference: `ZD-${payload.ticketNumber}`,
    title: payload.title,
    description: payload.description,
    solution: payload.solution,
    opened_at: payload.openedAt,
    closed_at: payload.closedAt,
    service_desk: payload.serviceDesk,
    service: payload.service,
    priority: payload.priority,
    total_minutes: payload.totalMinutes,
    billable_amount: payload.billableAmount,
    billing_notes: payload.billingNotes
  };
  body[flagField] = true;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sigeConfig?.token || config.sige.token}`
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(sigeConfig?.timeoutMs || 10000)
  });

  const responseJson = await res.json().catch(() => ({}));
  const success = res.ok;

  await prisma.sigeLog.create({
    data: {
      ticketId,
      payload: payload as Prisma.InputJsonValue,
      response: responseJson as Prisma.InputJsonValue,
      status: success ? 'created' : 'error'
    }
  });

  if (!success) {
    throw new Error(`SIGE error: ${res.status}`);
  }

  const externalId = responseJson.id || responseJson.externalId || `os-${payload.ticketNumber}`;
  return { externalId, status: 'created' };
}
