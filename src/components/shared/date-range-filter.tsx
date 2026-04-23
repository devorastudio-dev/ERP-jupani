import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  start?: string;
  end?: string;
}

export function DateRangeFilter({ start, end }: DateRangeFilterProps) {
  return (
    <form method="get" className="grid gap-2 sm:grid-cols-[160px_160px_auto_auto]">
      <label className="grid gap-1 text-xs text-stone-500">
        Início
        <input
          type="date"
          name="start"
          defaultValue={start}
          className="h-10 rounded-xl border border-rose-100 bg-white px-3 text-sm text-stone-700"
        />
      </label>
      <label className="grid gap-1 text-xs text-stone-500">
        Fim
        <input
          type="date"
          name="end"
          defaultValue={end}
          className="h-10 rounded-xl border border-rose-100 bg-white px-3 text-sm text-stone-700"
        />
      </label>
      <Button type="submit" variant="outline" className="self-end">
        Filtrar
      </Button>
      <Button type="submit" variant="ghost" name="reset" value="1" className="self-end">
        Limpar
      </Button>
    </form>
  );
}
