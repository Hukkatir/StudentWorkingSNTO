import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getSettingsWithValues } from "@/modules/admin/service";

export default async function AdminSettingsPage() {
  const settings = await getSettingsWithValues();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="admin"
        title="Правила начисления и бизнес-ограничения"
        description="Здесь сосредоточены параметры MVP: lookback, красная зона, автоодобрение и бонусы."
      />
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle>Глобальные настройки</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm items={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
