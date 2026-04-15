import { db } from "@/lib/db";
import { DutyBookingForm } from "@/components/duties/duty-booking-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/session";

export default async function StudentBookingsPage() {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  if (!session.user.studentProfileId || !session.user.primaryGroupId) {
    return null;
  }

  const [complexities, bookings] = await Promise.all([
    db.cleaningComplexity.findMany({
      where: { active: true },
      orderBy: { basePoints: "asc" },
    }),
    db.dutyBooking.findMany({
      where: { studentId: session.user.studentProfileId },
      include: { preferredComplexity: true },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="student"
        title="Бронирование дежурства"
        description="Можно заранее взять на себя дежурство, если день еще не закрыт."
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Новая бронь</CardTitle>
        </CardHeader>
        <CardContent>
          <DutyBookingForm
            studentId={session.user.studentProfileId}
            groupId={session.user.primaryGroupId}
            complexities={complexities.map((complexity) => ({
              code: complexity.code,
              label: complexity.label,
            }))}
          />
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>История бронирований</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {booking.preferredComplexity?.label ?? "Без предпочтения"}
                  </div>
                <div className="text-sm text-muted-foreground">
                  {booking.date.toLocaleDateString("ru-RU")}
                </div>
              </div>
              <StatusBadge status={booking.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
