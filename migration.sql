-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANUFACTURER', 'MRO', 'AIRLINE', 'INSPECTOR', 'ADMIN');
CREATE TYPE "ComponentState" AS ENUM ('REGISTERED', 'IN_SERVICE', 'AWAITING_INSPECTION', 'INSPECTED', 'ON_CHAIN_UPDATED', 'INSTALLATION_ELIGIBLE', 'INSTALLATION_BLOCKED', 'INSTALLED', 'QUARANTINED', 'DECOMMISSIONED');
CREATE TYPE "MaintenanceType" AS ENUM ('INSPECTION', 'OVERHAUL', 'REPAIR');
CREATE TYPE "MaintenanceStatus" AS ENUM ('AWAITING_INSPECTION', 'APPROVED', 'REJECTED', 'QUARANTINED');
CREATE TYPE "SignatureStatus" AS ENUM ('UNSIGNED', 'VERIFIED', 'INVALID');
CREATE TYPE "AttestationDecision" AS ENUM ('APPROVE', 'REJECT', 'QUARANTINE');
CREATE TYPE "ComplianceDecision" AS ENUM ('ALLOW', 'BLOCK', 'REVIEW_REQUIRED');
CREATE TYPE "ChainMode" AS ENUM ('SIMULATED', 'DEVNET');
CREATE TYPE "ChainStatus" AS ENUM ('SIMULATED', 'CONFIRMED', 'FAILED');
CREATE TYPE "ChainTxKind" AS ENUM ('ANCHOR', 'MINT');
CREATE TYPE "RegistryStatus" AS ENUM ('NOT_REGISTERED', 'SIMULATED', 'REGISTERED_ONCHAIN');

-- CreateTable
CREATE TABLE "Agent" (
  "id" TEXT NOT NULL, "agentCode" TEXT NOT NULL, "name" TEXT NOT NULL, "role" "Role" NOT NULL,
  "organization" TEXT NOT NULL, "authorized" BOOLEAN NOT NULL DEFAULT true, "walletAddress" TEXT,
  "registryStatus" "RegistryStatus" NOT NULL DEFAULT 'NOT_REGISTERED', "registryRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "role" "Role" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "agentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Component" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "partNumber" TEXT NOT NULL, "serialNumber" TEXT NOT NULL,
  "manufacturer" TEXT NOT NULL, "certificateRef" TEXT NOT NULL, "certificateHash" TEXT NOT NULL,
  "specs" JSONB, "state" "ComponentState" NOT NULL DEFAULT 'REGISTERED', "flightHours" INTEGER NOT NULL DEFAULT 0,
  "mintAddress" TEXT, "registeredBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL, "displayId" TEXT NOT NULL, "componentId" TEXT NOT NULL, "type" "MaintenanceType" NOT NULL,
  "work" TEXT NOT NULL, "flightHours" INTEGER NOT NULL, "status" "MaintenanceStatus" NOT NULL DEFAULT 'AWAITING_INSPECTION',
  "signatureStatus" "SignatureStatus" NOT NULL DEFAULT 'UNSIGNED', "signerPublicKey" TEXT, "signature" TEXT,
  "agentId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Document" (
  "id" TEXT NOT NULL, "componentId" TEXT NOT NULL, "recordId" TEXT, "name" TEXT NOT NULL, "sha256" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL, "storageUri" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Attestation" (
  "id" TEXT NOT NULL, "recordId" TEXT NOT NULL, "inspectorId" TEXT NOT NULL, "decision" "AttestationDecision" NOT NULL,
  "notes" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LifecycleEvent" (
  "id" TEXT NOT NULL, "componentId" TEXT NOT NULL, "fromState" "ComponentState", "toState" "ComponentState" NOT NULL,
  "action" TEXT NOT NULL, "actor" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LifecycleEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceRule" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "description" TEXT NOT NULL, "severity" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ComplianceResult" (
  "id" TEXT NOT NULL, "componentId" TEXT NOT NULL, "decision" "ComplianceDecision" NOT NULL,
  "failed" JSONB NOT NULL, "passed" JSONB NOT NULL, "ruleVersion" TEXT NOT NULL, "simulatedAnchor" BOOLEAN NOT NULL,
  "evaluatedBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChainTransaction" (
  "id" TEXT NOT NULL, "componentId" TEXT NOT NULL, "kind" "ChainTxKind" NOT NULL, "mode" "ChainMode" NOT NULL,
  "status" "ChainStatus" NOT NULL, "signature" TEXT, "simulatedRef" TEXT, "payloadHash" TEXT NOT NULL, "slot" INTEGER,
  "mintAddress" TEXT, "error" TEXT, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChainTransaction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL, "seq" INTEGER NOT NULL, "timestamp" TIMESTAMP(3) NOT NULL, "componentId" TEXT,
  "actor" TEXT NOT NULL, "action" TEXT NOT NULL, "outcome" TEXT NOT NULL, "txSignature" TEXT,
  "prevHash" TEXT NOT NULL, "entryHash" TEXT NOT NULL,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Agent_agentCode_key" ON "Agent"("agentCode");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Component_serialNumber_key" ON "Component"("serialNumber");
CREATE INDEX "Component_state_idx" ON "Component"("state");
CREATE UNIQUE INDEX "MaintenanceRecord_displayId_key" ON "MaintenanceRecord"("displayId");
CREATE INDEX "MaintenanceRecord_componentId_idx" ON "MaintenanceRecord"("componentId");
CREATE INDEX "Document_componentId_idx" ON "Document"("componentId");
CREATE INDEX "LifecycleEvent_componentId_idx" ON "LifecycleEvent"("componentId");
CREATE UNIQUE INDEX "ComplianceRule_code_key" ON "ComplianceRule"("code");
CREATE INDEX "ComplianceResult_componentId_idx" ON "ComplianceResult"("componentId");
CREATE UNIQUE INDEX "ChainTransaction_signature_key" ON "ChainTransaction"("signature");
CREATE INDEX "ChainTransaction_componentId_idx" ON "ChainTransaction"("componentId");
CREATE UNIQUE INDEX "AuditEvent_seq_key" ON "AuditEvent"("seq");

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MaintenanceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MaintenanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LifecycleEvent" ADD CONSTRAINT "LifecycleEvent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ComplianceResult" ADD CONSTRAINT "ComplianceResult_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChainTransaction" ADD CONSTRAINT "ChainTransaction_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
