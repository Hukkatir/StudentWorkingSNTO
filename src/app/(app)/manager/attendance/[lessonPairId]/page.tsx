import { AttendanceEditor } from "@/components/attendance/attendance-editor";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/session";
import { MANAGER_ROLES } from "@/lib/auth/permissions";
import { getAttendancePairData } from "@/modules/attendance/service";

export default async function AttendancePairPage({
  params,
}: {
  params: Promise<{ lessonPairId: string }>;
}) {
  await requireRole(MANAGER_ROLES);
  const { lessonPairId } = await params;
  const data = await getAttendancePairData(lessonPairId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="attendance" title="Быстрая отметка пары" />
      <AttendanceEditor
        lessonPair={data.lessonPair}
        reasons={data.reasons}
        students={data.students}
      />
    </div>
  );
}
