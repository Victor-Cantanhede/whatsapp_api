/*
  Warnings:

  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HealthCheck";

-- CreateTable
CREATE TABLE "Connections" (
    "id" SERIAL NOT NULL,
    "connection_name" TEXT NOT NULL,
    "user_token" TEXT NOT NULL,
    "phone_id" TEXT NOT NULL,
    "waba_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connections_connection_name_key" ON "Connections"("connection_name");

-- CreateIndex
CREATE UNIQUE INDEX "Connections_user_token_key" ON "Connections"("user_token");

-- CreateIndex
CREATE UNIQUE INDEX "Connections_phone_id_key" ON "Connections"("phone_id");

-- CreateIndex
CREATE UNIQUE INDEX "Connections_waba_id_key" ON "Connections"("waba_id");
