import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IngredientTableRow } from "@/lib/ingredient/functions";
import { cn } from "@/lib/utils";

const COLUMNS: Array<{
  key: keyof IngredientTableRow;
  label: string;
  className?: string;
}> = [
  { key: "name", label: "Name", className: "min-w-64" },
  { key: "calories", label: "Calories" },
  { key: "energy", label: "Energy" },
  { key: "protein", label: "Protein" },
  { key: "fatTotal", label: "Fat total" },
  { key: "fatSaturated", label: "Fat saturated" },
  { key: "carbohydrate", label: "Carbohydrate" },
  { key: "sugar", label: "Sugar" },
  { key: "dietaryFibre", label: "Dietary fibre" },
  { key: "sodium", label: "Sodium" },
];

export function IngredientTable({
  rows,
}: {
  readonly rows: IngredientTableRow[];
}) {
  return (
    <div className="overflow-hidden h-full min-h-0 rounded-3xl border shadow-xl border-border/70 bg-card/70 shadow-black/10 backdrop-blur-sm">
      <ScrollArea className="w-full h-full">
        <Table className="w-full min-w-[78rem]">
          <TableHeader className="bg-card/95">
            <TableRow className="hover:bg-transparent">
              {COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.className,
                    "sticky top-0 z-10 bg-card/95 backdrop-blur-sm",
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {COLUMNS.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {formatMetric(row[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function formatMetric(value: IngredientTableRow[keyof IngredientTableRow]) {
  if (typeof value === "number") return String(value);
  return value?.trim() || "-";
}
