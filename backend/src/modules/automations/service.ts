import prisma from '../../prisma.js';
import { sendNotification } from '../notifications/service.js';

interface AutomationContext {
  ticketId?: string;
  sample?: boolean;
}

export async function runAutomationActions(actions: any[], ctx: AutomationContext) {
  for (const action of actions) {
    switch (action.type) {
      case 'email':
        // Aqui enviaríamos email via nodemailer; para simplificar gravamos em log de notificação
        await sendNotification({
          userId: action.userId,
          title: action.subject || 'Email automação',
          body: action.body || 'Corpo do email'
        });
        break;
      case 'update_ticket':
        if (ctx.ticketId) {
          await prisma.ticket.update({ where: { id: ctx.ticketId }, data: action.data });
        }
        break;
      case 'create_appointment':
        await prisma.appointment.create({
          data: {
            title: action.title || 'Compromisso',
            description: action.description,
            startAt: new Date(action.startAt || Date.now()),
            endAt: new Date(action.endAt || Date.now() + 3600000),
            ticketId: ctx.ticketId || action.ticketId
          }
        });
        break;
      case 'notify':
        await sendNotification({
          userId: action.userId,
          title: action.title || 'Notificação',
          body: action.body || 'Mensagem'
        });
        break;
      case 'webhook':
        if (action.url) {
          await fetch(action.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ctx, payload: action.payload || {} })
          }).catch(() => {});
        }
        break;
      default:
        break;
    }
  }
}
