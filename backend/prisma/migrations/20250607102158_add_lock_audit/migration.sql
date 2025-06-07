-- CreateTable
CREATE TABLE "LockAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LockAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LockAudit_adminId_idx" ON "LockAudit"("adminId");

-- CreateIndex
CREATE INDEX "LockAudit_targetUserId_idx" ON "LockAudit"("targetUserId");

-- CreateIndex
CREATE INDEX "LockAudit_appointmentId_idx" ON "LockAudit"("appointmentId");

-- AddForeignKey
ALTER TABLE "LockAudit" ADD CONSTRAINT "LockAudit_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockAudit" ADD CONSTRAINT "LockAudit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockAudit" ADD CONSTRAINT "LockAudit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
