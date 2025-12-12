import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin!123' + config.pepper, 10);
  const adminRole = await prisma.role.upsert({
    where: { key: 'admin' },
    update: {},
    create: { key: 'admin', name: 'Administrador' }
  });
  const perms = [
    'tickets:read',
    'tickets:write',
    'clients:write',
    'contracts:write',
    'assets:write',
    'automations:write'
  ];
  for (const p of perms) {
    const perm = await prisma.permission.upsert({
      where: { key: p },
      update: {},
      create: { key: p, label: p }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id }
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@zendrix.test' },
    update: {},
    create: {
      email: 'admin@zendrix.test',
      name: 'Admin',
      passwordHash,
      roles: { create: { roleId: adminRole.id } }
    }
  });

  const client = await prisma.client.upsert({
    where: { name: 'Cliente Demo' },
    update: {},
    create: {
      name: 'Cliente Demo',
      tags: ['demo']
    }
  });

  await prisma.contact.upsert({
    where: { email: 'contato@cliente.demo' },
    update: {},
    create: {
      clientId: client.id,
      name: 'Contato Demo',
      email: 'contato@cliente.demo',
      portalAccess: true,
      passwordHash: await bcrypt.hash('Portal!123' + config.pepper, 10)
    }
  });

  const desk = await prisma.serviceDesk.upsert({
    where: { name: 'Suporte N1' },
    update: {},
    create: {
      name: 'Suporte N1',
      description: 'Mesa principal'
    }
  });

  const stageTriagem = await prisma.stage.upsert({
    where: { id: 'stage-triagem' },
    update: {},
    create: { id: 'stage-triagem', serviceDeskId: desk.id, name: 'Triagem', order: 1, pauseSla: false }
  });
  const stageAndamento = await prisma.stage.upsert({
    where: { id: 'stage-andamento' },
    update: {},
    create: { id: 'stage-andamento', serviceDeskId: desk.id, name: 'Em andamento', order: 2, pauseSla: false }
  });
  const stageAguardando = await prisma.stage.upsert({
    where: { id: 'stage-aguardando' },
    update: {},
    create: { id: 'stage-aguardando', serviceDeskId: desk.id, name: 'Aguardando cliente', order: 3, pauseSla: true }
  });
  await prisma.stage.upsert({
    where: { id: 'stage-fechado' },
    update: {},
    create: { id: 'stage-fechado', serviceDeskId: desk.id, name: 'Fechado', order: 4, pauseSla: false }
  });

  const priority = await prisma.priority.upsert({
    where: { id: 'priority-normal' },
    update: {},
    create: { id: 'priority-normal', serviceDeskId: desk.id, name: 'Normal', color: '#3b82f6', order: 1, slaMinutes: 240 }
  });

  const service = await prisma.serviceCatalog.upsert({
    where: { id: 'service-suporte' },
    update: {},
    create: {
      id: 'service-suporte',
      serviceDeskId: desk.id,
      name: 'Suporte',
      description: 'Atendimento padrão',
      hourlyRate: 150,
      slaMinutes: 240
    }
  });

  const contractSla = await prisma.contractSLA.create({
    data: {
      firstResponseMins: 60,
      resolutionMins: 480,
      pausesByStageIds: [stageAguardando.id],
      businessHoursStart: 8,
      businessHoursEnd: 18
    }
  });

  await prisma.contract.upsert({
    where: { id: 'contract-demo' },
    update: {},
    create: {
      id: 'contract-demo',
      clientId: client.id,
      name: 'Contrato Demo',
      type: 'fixed',
      status: 'active',
      hourlyRate: 0,
      managedLimit: 10,
      allowExceed: false,
      slaId: contractSla.id,
      limits: {
        create: {
          managedTotal: 10,
          allowExceed: false
        }
      }
    }
  });

  await prisma.automation.upsert({
    where: { id: 'automation-sla-alert' },
    update: {},
    create: {
      id: 'automation-sla-alert',
      serviceDeskId: desk.id,
      name: 'Alerta SLA perto de estourar',
      trigger: { event: 'sla_warning' },
      actions: [{ type: 'notify', userId: admin.id, title: 'SLA perto de estourar', body: 'Verifique tickets críticos' }]
    }
  });

  console.log('Seed concluído');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
