import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

const pepper = process.env.PEPPER || 'pepper';

const prisma = new PrismaClient();

async function ensureRoleWithPerms(roleKey, name, perms) {
  const role = await prisma.role.upsert({
    where: { key: roleKey },
    update: { name },
    create: { key: roleKey, name }
  });
  for (const p of perms) {
    const perm = await prisma.permission.upsert({
      where: { key: p },
      update: { label: p },
      create: { key: p, label: p }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id }
    });
  }
  return role;
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin!123' + pepper, 10);
  const adminRole = await ensureRoleWithPerms('admin', 'Administrador', [
    'tickets:read',
    'tickets:write',
    'clients:write',
    'contracts:write',
    'assets:write',
    'automations:write'
  ]);

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

  let client = await prisma.client.findFirst({ where: { name: 'Cliente Demo' } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Cliente Demo',
        tags: ['demo']
      }
    });
  }

  const contactExists = await prisma.contact.findFirst({ where: { email: 'contato@cliente.demo' } });
  if (!contactExists) {
    await prisma.contact.create({
      data: {
        clientId: client.id,
        name: 'Contato Demo',
        email: 'contato@cliente.demo',
        portalAccess: true,
        passwordHash: await bcrypt.hash('Portal!123' + pepper, 10)
      }
    });
  }

  let desk = await prisma.serviceDesk.findFirst({ where: { name: 'Suporte N1' } });
  if (!desk) {
    desk = await prisma.serviceDesk.create({ data: { name: 'Suporte N1', description: 'Mesa principal' } });
  }

  const stagesToEnsure = [
    { name: 'Triagem', order: 1, pauseSla: false },
    { name: 'Em andamento', order: 2, pauseSla: false },
    { name: 'Aguardando cliente', order: 3, pauseSla: true },
    { name: 'Fechado', order: 4, pauseSla: false }
  ];
  for (const st of stagesToEnsure) {
    const existing = await prisma.stage.findFirst({ where: { serviceDeskId: desk.id, name: st.name } });
    if (!existing) {
      await prisma.stage.create({ data: { ...st, serviceDeskId: desk.id } });
    }
  }

  let priority = await prisma.priority.findFirst({ where: { serviceDeskId: desk.id, name: 'Normal' } });
  if (!priority) {
    priority = await prisma.priority.create({
      data: { serviceDeskId: desk.id, name: 'Normal', color: '#3b82f6', order: 1, slaMinutes: 240 }
    });
  }

  let service = await prisma.serviceCatalog.findFirst({ where: { serviceDeskId: desk.id, name: 'Suporte' } });
  if (!service) {
    service = await prisma.serviceCatalog.create({
      data: {
        serviceDeskId: desk.id,
        name: 'Suporte',
        description: 'Atendimento padrão',
        hourlyRate: 150,
        slaMinutes: 240
      }
    });
  }

  let contractSla = await prisma.contractSLA.findFirst({
    where: { firstResponseMins: 60, resolutionMins: 480, businessHoursStart: 8, businessHoursEnd: 18 }
  });
  if (!contractSla) {
    contractSla = await prisma.contractSLA.create({
      data: {
        firstResponseMins: 60,
        resolutionMins: 480,
        pausesByStageIds: [],
        businessHoursStart: 8,
        businessHoursEnd: 18
      }
    });
  }

  const contract = await prisma.contract.findFirst({ where: { clientId: client.id, name: 'Contrato Demo' } });
  if (!contract) {
    await prisma.contract.create({
      data: {
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
  }

  const automation = await prisma.automation.findFirst({ where: { name: 'Alerta SLA perto de estourar' } });
  if (!automation) {
    await prisma.automation.create({
      data: {
        serviceDeskId: desk.id,
        name: 'Alerta SLA perto de estourar',
        trigger: { event: 'sla_warning' },
        actions: [{ type: 'notify', userId: admin.id, title: 'SLA perto de estourar', body: 'Verifique tickets críticos' }]
      }
    });
  }

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
