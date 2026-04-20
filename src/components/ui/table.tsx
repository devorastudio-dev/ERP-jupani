import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b border-rose-100" {...props} />
);
export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="[&_tr:last-child]:border-0" {...props} />
);
export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-rose-50 transition-colors hover:bg-rose-50/50", className)} {...props} />
);
export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-11 px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 md:px-4 md:text-sm md:normal-case md:tracking-normal", className)} {...props} />
);
export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-3 py-3 align-middle text-sm text-stone-700 md:p-4", className)} {...props} />
);
