-- Base DDL gerado a partir de schema.prisma. Para reproduzir ou atualizar use `pnpm prisma migrate dev`.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "totpEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "totpSecret" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Role" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "key" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL
);

CREATE TABLE "Permission" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "key" TEXT UNIQUE NOT NULL,
  "label" TEXT NOT NULL
);

CREATE TABLE "RolePermission" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "roleId" UUID NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES "Permission"(id) ON DELETE CASCADE,
  UNIQUE ("roleId","permissionId")
);

CREATE TABLE "UserRole" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "roleId" UUID NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
  UNIQUE ("userId","roleId")
);

CREATE TABLE "ServiceGroup" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL
);

CREATE TABLE "UserServiceGroup" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "serviceGroupId" UUID NOT NULL REFERENCES "ServiceGroup"(id) ON DELETE CASCADE,
  UNIQUE ("userId","serviceGroupId")
);

CREATE TABLE "Client" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "document" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "externalSource" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Contact" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "portalAccess" BOOLEAN NOT NULL DEFAULT FALSE,
  "passwordHash" TEXT,
  "externalSource" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE "ContractStatus" AS ENUM ('active','inactive','pending_reajuste','closed');
CREATE TYPE "ContractType" AS ENUM ('fixed','bank_hours','franchise');
CREATE TABLE "ContractSLA" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstResponseMins" INT NOT NULL,
  "resolutionMins" INT NOT NULL,
  "pausesByStageIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "businessHoursStart" INT NOT NULL DEFAULT 8,
  "businessHoursEnd" INT NOT NULL DEFAULT 18,
  "holidays" TIMESTAMP[] NOT NULL DEFAULT ARRAY[]::TIMESTAMP[]
);

CREATE TABLE "Contract" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "ContractType" NOT NULL,
  "status" "ContractStatus" NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "reajusteBase" TIMESTAMP,
  "hourlyRate" DECIMAL(10,2),
  "managedLimit" INT NOT NULL DEFAULT 0,
  "allowExceed" BOOLEAN NOT NULL DEFAULT FALSE,
  "slaId" UUID REFERENCES "ContractSLA"(id),
  "externalSource" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "ContractLimit" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "contractId" UUID UNIQUE NOT NULL REFERENCES "Contract"(id) ON DELETE CASCADE,
  "managedTotal" INT NOT NULL,
  "allowExceed" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "ServiceDesk" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Stage" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceDeskId" UUID NOT NULL REFERENCES "ServiceDesk"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "order" INT NOT NULL,
  "pauseSla" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "Priority" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceDeskId" UUID NOT NULL REFERENCES "ServiceDesk"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "order" INT NOT NULL,
  "slaMinutes" INT
);

CREATE TABLE "ServiceCatalog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceDeskId" UUID NOT NULL REFERENCES "ServiceDesk"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "hourlyRate" DECIMAL(10,2),
  "slaMinutes" INT
);

CREATE TABLE "DeskCustomField" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceDeskId" UUID NOT NULL REFERENCES "ServiceDesk"(id) ON DELETE CASCADE,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TYPE "TicketStatus" AS ENUM ('open','in_progress','paused','closed');
CREATE TABLE "Ticket" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "number" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "clientId" UUID NOT NULL REFERENCES "Client"(id),
  "contactId" UUID REFERENCES "Contact"(id),
  "contractId" UUID REFERENCES "Contract"(id),
  "serviceDeskId" UUID NOT NULL REFERENCES "ServiceDesk"(id),
  "stageId" UUID NOT NULL REFERENCES "Stage"(id),
  "priorityId" UUID NOT NULL REFERENCES "Priority"(id),
  "serviceId" UUID REFERENCES "ServiceCatalog"(id),
  "assigneeId" UUID REFERENCES "User"(id),
  "serviceGroupId" UUID REFERENCES "ServiceGroup"(id),
  "parentId" UUID REFERENCES "Ticket"(id),
  "status" "TicketStatus" NOT NULL DEFAULT 'open',
  "billableAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "noCost" BOOLEAN NOT NULL DEFAULT FALSE,
  "billingNotes" TEXT,
  "sigeStatus" TEXT,
  "sigeOrderId" TEXT,
  "sigeMode" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "closedAt" TIMESTAMP,
  "dueAt" TIMESTAMP
);

CREATE TABLE "TicketComment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "authorId" UUID REFERENCES "User"(id),
  "isPublic" BOOLEAN NOT NULL DEFAULT TRUE,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "TicketFollower" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE ("ticketId","userId")
);

CREATE TYPE "RelationType" AS ENUM ('parent','child','related','duplicate');
CREATE TABLE "TicketRelation" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "relatedId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "relation" "RelationType" NOT NULL,
  UNIQUE ("ticketId","relatedId","relation")
);

CREATE TABLE "TicketChecklistItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "TicketTimeEntry" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id),
  "minutes" INT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "TicketAttachment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "TicketHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "metadata" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "TicketSLAState" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID UNIQUE NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "firstResponseDueAt" TIMESTAMP,
  "resolutionDueAt" TIMESTAMP,
  "firstRespondedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "pausedAt" TIMESTAMP,
  "totalPausedMinutes" INT NOT NULL DEFAULT 0
);

CREATE TABLE "CSATRating" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID UNIQUE NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "rating" INT NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Automation" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "serviceDeskId" UUID REFERENCES "ServiceDesk"(id),
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "trigger" JSON NOT NULL,
  "actions" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "NotificationPreference" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE "Asset" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "clientId" UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
  "contractId" UUID REFERENCES "Contract"(id),
  "type" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "serial" TEXT,
  "serviceTag" TEXT NOT NULL,
  "managed" BOOLEAN NOT NULL DEFAULT FALSE,
  "location" TEXT,
  "status" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Appointment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startAt" TIMESTAMP NOT NULL,
  "endAt" TIMESTAMP NOT NULL,
  "recurrence" TEXT,
  "ticketId" UUID REFERENCES "Ticket"(id),
  "clientId" UUID REFERENCES "Client"(id),
  "createdById" UUID REFERENCES "User"(id),
  "reminderMins" INT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "AppointmentParticipant" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "appointmentId" UUID NOT NULL REFERENCES "Appointment"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id),
  "contactId" UUID REFERENCES "Contact"(id)
);

CREATE TABLE "SigeConfig" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "mode" TEXT NOT NULL DEFAULT 'sandbox',
  "baseUrl" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "osEndpoint" TEXT NOT NULL,
  "osFlagField" TEXT NOT NULL,
  "retryCount" INT NOT NULL DEFAULT 3,
  "timeoutMs" INT NOT NULL DEFAULT 10000,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "SigeLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID REFERENCES "Ticket"(id) ON DELETE SET NULL,
  "payload" JSON NOT NULL,
  "response" JSON,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "SigeQueue" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID UNIQUE NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INT NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "JobQueue" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" TEXT NOT NULL,
  "payload" JSON NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INT NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "PasswordResetToken" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES "User"(id),
  "action" TEXT NOT NULL,
  "metadata" JSON NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_stage ON "Ticket" ("stageId");
CREATE INDEX idx_ticket_priority ON "Ticket" ("priorityId");
CREATE INDEX idx_ticket_client ON "Ticket" ("clientId");
CREATE INDEX idx_ticket_status ON "Ticket" ("status");
CREATE INDEX idx_asset_client ON "Asset" ("clientId");
CREATE INDEX idx_contract_client ON "Contract" ("clientId");
