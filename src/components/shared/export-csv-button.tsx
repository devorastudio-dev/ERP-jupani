"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function ExportCsvButton({
  filename,
  rows,
  label = "Exportar CSV",
}: {
  filename: string;
  rows: Array<Record<string, unknown>>;
  label?: string;
}) {
  const handleExport = () => {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={!rows.length}>
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
