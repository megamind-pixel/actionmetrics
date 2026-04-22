-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER', 'ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('Primary', 'Secondary', 'University');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('Primary', 'Secondary', 'University');

-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('percent', 'gpa');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "instId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "county" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "stuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "class" TEXT NOT NULL,
    "programme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "stuId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "scoreType" "ScoreType" NOT NULL DEFAULT 'percent',
    "normalised" DOUBLE PRECISION NOT NULL,
    "term" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE UNIQUE INDEX "institutions_instId_key" ON "institutions"("instId");
CREATE UNIQUE INDEX "students_stuId_key" ON "students"("stuId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_instId_fkey"
  FOREIGN KEY ("instId") REFERENCES "institutions"("instId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "results" ADD CONSTRAINT "results_stuId_fkey"
  FOREIGN KEY ("stuId") REFERENCES "students"("stuId") ON DELETE CASCADE ON UPDATE CASCADE;
