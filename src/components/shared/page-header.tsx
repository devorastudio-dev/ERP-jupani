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
    <div className="mb-5 flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-sm shadow-rose-100/60 backdrop-blur md:mb-6 md:flex-row md:items-end md:justify-between md:px-6 md:py-5">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-rose-400">Painel interno</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      <div className="w-full md:w-auto [&>*]:w-full md:[&>*]:w-auto">
        {action ?? <Button variant="outline">Exportar</Button>}
      </div>
    </div>
  );
}
