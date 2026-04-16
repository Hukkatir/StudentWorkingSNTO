-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('ADMIN', 'CURATOR', 'GROUP_MANAGER', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "ScheduleImportStatus" AS ENUM ('PREVIEW', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "LessonDayStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "LessonPairStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AbsenceRequestType" AS ENUM ('LESSON', 'DAY');

-- CreateEnum
CREATE TYPE "AbsenceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_REGISTERED');

-- CreateEnum
CREATE TYPE "DutyAssignmentMode" AS ENUM ('MANUAL', 'AUTO', 'BOOKED', 'REPLACEMENT');

-- CreateEnum
CREATE TYPE "DutyAssignmentStatus" AS ENUM ('ASSIGNED', 'COMPLETED', 'REFUSED', 'ESCAPED', 'REPLACED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CleaningComplexityCode" AS ENUM ('LIGHT', 'MODERATE', 'FULL');

-- CreateEnum
CREATE TYPE "CleaningQuality" AS ENUM ('EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY', 'NOT_DONE');

-- CreateEnum
CREATE TYPE "DutyBookingStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('DUTY_BASE', 'DUTY_BONUS', 'PENALTY_REFUSAL', 'PENALTY_ESCAPE', 'QUALITY_BONUS', 'QUALITY_PENALTY', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PenaltyReasonCode" AS ENUM ('REFUSAL', 'ESCAPE', 'UNSATISFACTORY_CLEANING', 'NO_SHOW', 'MANUAL');

-- CreateEnum
CREATE TYPE "BonusReasonCode" AS ENUM ('REPLACEMENT', 'QUALITY_EXCELLENT', 'EXTRA_CLEANING', 'MANUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ALERT');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT,
    "passwordHash" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'credentials',
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "roleCode" "RoleCode" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentNumber" TEXT,
    "isMonitor" BOOLEAN NOT NULL DEFAULT false,
    "isDeputy" BOOLEAN NOT NULL DEFAULT false,
    "isAttendanceManager" BOOLEAN NOT NULL DEFAULT false,
    "currentDutyScore" INTEGER NOT NULL DEFAULT 0,
    "totalDuties" INTEGER NOT NULL DEFAULT 0,
    "totalAbsences" INTEGER NOT NULL DEFAULT 0,
    "totalPenalties" INTEGER NOT NULL DEFAULT 0,
    "totalBonuses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleImport" (
    "id" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "sourceMimeType" TEXT,
    "rawPayload" TEXT,
    "previewData" JSONB,
    "validationErrors" JSONB,
    "status" "ScheduleImportStatus" NOT NULL DEFAULT 'PREVIEW',
    "importedById" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pairNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherId" TEXT,
    "room" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sourceImportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDay" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "LessonDayStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPair" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "lessonDayId" TEXT NOT NULL,
    "scheduleItemId" TEXT,
    "pairNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherId" TEXT,
    "room" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "LessonPairStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceReason" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "scheduleItemId" TEXT NOT NULL,
    "lessonPairId" TEXT,
    "status" "AttendanceStatus" NOT NULL,
    "reasonId" TEXT,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "AbsenceRequestType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scheduleItemId" TEXT,
    "lessonPairId" TEXT,
    "reasonId" TEXT NOT NULL,
    "comment" TEXT,
    "status" "AbsenceRequestStatus" NOT NULL DEFAULT 'AUTO_REGISTERED',
    "autoApplied" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningComplexity" (
    "id" TEXT NOT NULL,
    "code" "CleaningComplexityCode" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "basePoints" INTEGER NOT NULL,
    "replacementBonus" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningComplexity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyBooking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "preferredComplexityId" TEXT,
    "status" "DutyBookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "relatedLessonDayId" TEXT,
    "relatedLessonPairId" TEXT,
    "assignedStudentId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "bookingId" TEXT,
    "assignmentMode" "DutyAssignmentMode" NOT NULL,
    "status" "DutyAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "cleaningComplexityId" TEXT NOT NULL,
    "basePoints" INTEGER NOT NULL DEFAULT 0,
    "penaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyReplacement" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "originalStudentId" TEXT NOT NULL,
    "replacementStudentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DutyReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningEvaluation" (
    "id" TEXT NOT NULL,
    "dutyAssignmentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "replacementStudentId" TEXT,
    "quality" "CleaningQuality" NOT NULL,
    "comment" TEXT,
    "penaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "markedRefusal" BOOLEAN NOT NULL DEFAULT false,
    "markedEscape" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenaltyReason" (
    "id" TEXT NOT NULL,
    "code" "PenaltyReasonCode" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "defaultPoints" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenaltyReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusReason" (
    "id" TEXT NOT NULL,
    "code" "BonusReasonCode" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "defaultPoints" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "relatedDutyAssignmentId" TEXT,
    "penaltyReasonId" TEXT,
    "bonusReasonId" TEXT,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "href" TEXT,
    "dataJson" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "valueJson" JSONB NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_roleCode_idx" ON "GroupMembership"("groupId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_userId_groupId_roleCode_key" ON "GroupMembership"("userId", "groupId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_groupId_idx" ON "StudentProfile"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE INDEX "ScheduleImport_status_createdAt_idx" ON "ScheduleImport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduleItem_groupId_date_idx" ON "ScheduleItem"("groupId", "date");

-- CreateIndex
CREATE INDEX "ScheduleItem_sourceImportId_idx" ON "ScheduleItem"("sourceImportId");

-- CreateIndex
CREATE INDEX "LessonDay_groupId_status_idx" ON "LessonDay"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDay_groupId_date_key" ON "LessonDay"("groupId", "date");

-- CreateIndex
CREATE INDEX "LessonPair_groupId_lessonDayId_idx" ON "LessonPair"("groupId", "lessonDayId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPair_lessonDayId_pairNumber_key" ON "LessonPair"("lessonDayId", "pairNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceReason_code_key" ON "AbsenceReason"("code");

-- CreateIndex
CREATE INDEX "AttendanceRecord_groupId_scheduleItemId_idx" ON "AttendanceRecord"("groupId", "scheduleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_scheduleItemId_key" ON "AttendanceRecord"("studentId", "scheduleItemId");

-- CreateIndex
CREATE INDEX "AbsenceRequest_groupId_date_idx" ON "AbsenceRequest"("groupId", "date");

-- CreateIndex
CREATE INDEX "AbsenceRequest_studentId_status_idx" ON "AbsenceRequest"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningComplexity_code_key" ON "CleaningComplexity"("code");

-- CreateIndex
CREATE INDEX "DutyBooking_groupId_date_status_idx" ON "DutyBooking"("groupId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DutyBooking_studentId_date_key" ON "DutyBooking"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DutyAssignment_bookingId_key" ON "DutyAssignment"("bookingId");

-- CreateIndex
CREATE INDEX "DutyAssignment_groupId_date_status_idx" ON "DutyAssignment"("groupId", "date", "status");

-- CreateIndex
CREATE INDEX "DutyAssignment_relatedLessonPairId_idx" ON "DutyAssignment"("relatedLessonPairId");

-- CreateIndex
CREATE INDEX "DutyAssignment_assignedStudentId_status_idx" ON "DutyAssignment"("assignedStudentId", "status");

-- CreateIndex
CREATE INDEX "DutyReplacement_assignmentId_idx" ON "DutyReplacement"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningEvaluation_dutyAssignmentId_key" ON "CleaningEvaluation"("dutyAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyReason_code_key" ON "PenaltyReason"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BonusReason_code_key" ON "BonusReason"("code");

-- CreateIndex
CREATE INDEX "PointTransaction_studentId_createdAt_idx" ON "PointTransaction"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "PointTransaction_groupId_createdAt_idx" ON "PointTransaction"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleImport" ADD CONSTRAINT "ScheduleImport_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "ScheduleImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDay" ADD CONSTRAINT "LessonDay_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDay" ADD CONSTRAINT "LessonDay_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPair" ADD CONSTRAINT "LessonPair_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPair" ADD CONSTRAINT "LessonPair_lessonDayId_fkey" FOREIGN KEY ("lessonDayId") REFERENCES "LessonDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPair" ADD CONSTRAINT "LessonPair_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "ScheduleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPair" ADD CONSTRAINT "LessonPair_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "ScheduleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_lessonPairId_fkey" FOREIGN KEY ("lessonPairId") REFERENCES "LessonPair"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "AbsenceReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "ScheduleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_lessonPairId_fkey" FOREIGN KEY ("lessonPairId") REFERENCES "LessonPair"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "AbsenceReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyBooking" ADD CONSTRAINT "DutyBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyBooking" ADD CONSTRAINT "DutyBooking_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyBooking" ADD CONSTRAINT "DutyBooking_preferredComplexityId_fkey" FOREIGN KEY ("preferredComplexityId") REFERENCES "CleaningComplexity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_relatedLessonDayId_fkey" FOREIGN KEY ("relatedLessonDayId") REFERENCES "LessonDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_relatedLessonPairId_fkey" FOREIGN KEY ("relatedLessonPairId") REFERENCES "LessonPair"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_assignedStudentId_fkey" FOREIGN KEY ("assignedStudentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "DutyBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_cleaningComplexityId_fkey" FOREIGN KEY ("cleaningComplexityId") REFERENCES "CleaningComplexity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReplacement" ADD CONSTRAINT "DutyReplacement_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DutyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReplacement" ADD CONSTRAINT "DutyReplacement_originalStudentId_fkey" FOREIGN KEY ("originalStudentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReplacement" ADD CONSTRAINT "DutyReplacement_replacementStudentId_fkey" FOREIGN KEY ("replacementStudentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyReplacement" ADD CONSTRAINT "DutyReplacement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningEvaluation" ADD CONSTRAINT "CleaningEvaluation_dutyAssignmentId_fkey" FOREIGN KEY ("dutyAssignmentId") REFERENCES "DutyAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningEvaluation" ADD CONSTRAINT "CleaningEvaluation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningEvaluation" ADD CONSTRAINT "CleaningEvaluation_replacementStudentId_fkey" FOREIGN KEY ("replacementStudentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_relatedDutyAssignmentId_fkey" FOREIGN KEY ("relatedDutyAssignmentId") REFERENCES "DutyAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_penaltyReasonId_fkey" FOREIGN KEY ("penaltyReasonId") REFERENCES "PenaltyReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_bonusReasonId_fkey" FOREIGN KEY ("bonusReasonId") REFERENCES "BonusReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

