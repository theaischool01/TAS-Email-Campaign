-- AddColumn (applied via db push, backfilling into migration history)
ALTER TABLE "campaign_activity_logs" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- CreateIndex
CREATE INDEX "campaign_activity_logs_campaignId_action_idx" ON "campaign_activity_logs"("campaignId", "action");

-- CreateIndex
CREATE INDEX "campaign_activity_logs_campaignId_contactId_action_idx" ON "campaign_activity_logs"("campaignId", "contactId", "action");

-- CreateIndex
CREATE INDEX "campaign_activity_logs_campaignId_createdAt_idx" ON "campaign_activity_logs"("campaignId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "campaign_activity_logs_contactId_idx" ON "campaign_activity_logs"("contactId");

-- CreateIndex
CREATE INDEX "campaign_activity_logs_createdAt_idx" ON "campaign_activity_logs"("createdAt" DESC);
