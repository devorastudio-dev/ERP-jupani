import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
          <p className="mt-2 text-xs text-stone-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
