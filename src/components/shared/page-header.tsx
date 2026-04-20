import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">{description}</p>
      </div>
      {action ?? <Button variant="outline">Exportar</Button>}
    </div>
  );
}
