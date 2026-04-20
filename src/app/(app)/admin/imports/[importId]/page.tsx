import { confirmScheduleImportAction } from "@/actions/admin";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScheduleImportPreview } from "@/modules/schedule/service";

export default async function ImportPreviewPage({
  params,
}: {
  params: Promise<{ importId: string }>;
}) {
  const { importId } = await params;
  const { scheduleImport, previewData } = await getScheduleImportPreview(importId);
  const hasItems = previewData.items.length > 0;
  const readyItemsCount = previewData.items.filter((item) => item.groupId).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title={`Предпросмотр: ${scheduleImport.sourceFilename}`}
        description="Перед подтверждением можно оценить, какие записи система смогла распознать и подготовить к импорту."
        actions={
          <form
            action={async () => {
              "use server";
              await confirmScheduleImportAction(importId);
            }}
          >
            <Button type="submit" disabled={readyItemsCount === 0}>
              {readyItemsCount === 0 ? "Нечего переносить" : "Подтвердить импорт"}
            </Button>
          </form>
        }
      />

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Сводка по импорту</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Файл</div>
            <div className="mt-2 font-medium">{scheduleImport.sourceFilename}</div>
          </div>
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Найдено записей
            </div>
            <div className="mt-2 text-2xl font-semibold">{previewData.items.length}</div>
          </div>
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Готово к импорту
            </div>
            <div className="mt-2 text-2xl font-semibold">{readyItemsCount}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Предупреждения</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {previewData.warnings.length > 0 ? (
            previewData.warnings.map((warning) => (
              <div key={warning} className="rounded-2xl bg-amber-500/10 p-3 text-amber-800">
                {warning}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-800">
              Критичных предупреждений нет.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Записи</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {hasItems ? (
            previewData.items.slice(0, 30).map((item, index) => (
              <div key={`${item.groupName}-${index}`} className="rounded-2xl border p-4">
                <div className="font-medium">
                  {item.groupName} • {item.subject}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.date.slice(0, 10)} • пара {item.pairNumber} • {item.startTime} -{" "}
                  {item.endTime}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-5 text-sm text-muted-foreground">
              В этом файле не нашлось распознанных строк расписания. Посмотрите предупреждения выше:
              они подскажут, почему импорт пока не готов к подтверждению.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
