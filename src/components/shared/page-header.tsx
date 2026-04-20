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
    <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 px-5 py-5 shadow-sm shadow-rose-100/60 backdrop-blur md:flex-row md:items-end md:justify-between md:px-6">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-rose-400">Painel interno</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      {action ?? <Button variant="outline">Exportar</Button>}
    </div>
  );
}
