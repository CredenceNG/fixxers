-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'PAGE_VIEW', 'ORDER_CREATED', 'ORDER_COMPLETED', 'GIG_CREATED', 'GIG_PUBLISHED', 'PROFILE_UPDATED', 'PROFILE_COMPLETED', 'SEARCH', 'QUOTE_SUBMITTED', 'REVIEW_SUBMITTED', 'PAYMENT_MADE', 'REGISTRATION');

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "page" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_action_idx" ON "UserActivity"("action");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_sessionId_idx" ON "UserActivity"("sessionId");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
