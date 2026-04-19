import { Settings2, SlidersHorizontal } from "lucide-react";

import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsWithValues } from "@/modules/admin/service";

export default async function AdminSettingsPage() {
  const settings = await getSettingsWithValues();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="admin" title="Правила системы" />

      <div className="flex max-w-5xl flex-col gap-4">
        <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(0,136,130,0.08),transparent_70%)] shadow-none">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Settings2 className="size-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Глобальная конфигурация
              </div>
              <div className="mt-2 text-xl font-semibold tracking-tight">
                Начисления, лимиты и автообработка
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Здесь собраны ключевые ограничения и правила, которые влияют на
              посещаемость, бронирование и оценку дежурств.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="size-5 text-primary" />
              Параметры
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <SettingsForm items={settings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
