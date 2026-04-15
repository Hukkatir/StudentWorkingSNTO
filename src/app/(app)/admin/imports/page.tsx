import Link from "next/link";

import { ScheduleImportUploader } from "@/components/admin/schedule-import-uploader";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SCHEDULE_ADAPTER_LABELS,
  SCHEDULE_IMPORT_STATUS_LABELS,
} from "@/lib/constants";
import { listScheduleImports } from "@/modules/schedule/service";

export default async function AdminImportsPage() {
  const imports = await listScheduleImports();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Импорт расписания"
        description="Тестовый адаптер уже готов, а дальше сюда можно подключить конкретные парсеры формата."
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Новый импорт</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleImportUploader />
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>История импортов</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {imports.map((item) => (
            <Link
              key={item.id}
              href={`/admin/imports/${item.id}`}
              className="rounded-2xl border border-border/60 p-4 transition-colors hover:bg-muted/60"
            >
              <div className="font-medium">{item.sourceFilename}</div>
              <div className="text-sm text-muted-foreground">
                {SCHEDULE_IMPORT_STATUS_LABELS[item.status]} • {item.itemCount} записей •{" "}
                {SCHEDULE_ADAPTER_LABELS[item.adapterKey] ?? item.adapterKey}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
