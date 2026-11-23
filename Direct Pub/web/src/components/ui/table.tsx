"use client";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> { key: keyof T & string; label: string; numeric?: boolean; render?: (row: T) => React.ReactNode }

/** Tableau triable. Les en-têtes sont des boutons ; aria-sort indique le tri actif. */
export function DataTable<T extends { id: string }>({ columns, rows, caption }: { columns: Column<T>[]; rows: T[]; caption: string }) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const x = a[sort.key as keyof T], y = b[sort.key as keyof T];
      const r = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort]);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                  className={cn("border-b border-border px-3 py-2 font-medium text-text-muted", c.numeric ? "text-right" : "text-left")}>
                  <button type="button" className="inline-flex items-center gap-1 hover:text-text"
                    onClick={() => setSort({ key: c.key, dir: active && sort!.dir === "desc" ? "asc" : "desc" })}>
                    {c.label}
                    {active ? (sort!.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-surface">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2", c.numeric && "text-right tabular-nums")}>
                  {c.render ? c.render(r) : String(r[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
