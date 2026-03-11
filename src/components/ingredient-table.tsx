import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingFn,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";

import { CreateIngredientSheet } from "@/components/create-ingredient-sheet";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IngredientTableRow } from "@/lib/ingredient/functions";
import { matchesIngredientRow } from "@/lib/ingredient/search";
import { cn } from "@/lib/utils";

const metricSortingFn: SortingFn<IngredientTableRow> = (
  rowA,
  rowB,
  columnId,
) => {
  const leftValue = parseMetricNumber(rowA.getValue(columnId));
  const rightValue = parseMetricNumber(rowB.getValue(columnId));

  if (leftValue === null && rightValue === null) {
    return 0;
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  return leftValue - rightValue;
};

const columns: ColumnDef<IngredientTableRow>[] = [
  {
    accessorKey: "name",
    enableHiding: false,
    minSize: 320,
    size: 360,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ getValue }) => (
      <div className="font-medium min-w-64 text-foreground">
        {formatMetric(getValue())}
      </div>
    ),
  },
  {
    accessorKey: "isAusFood",
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Aus food" />
    ),
    cell: ({ getValue }) => {
      const isAusFood = getValue() === true;

      return (
        <div className="flex justify-center">
          <Badge variant={isAusFood ? "default" : "secondary"}>
            {isAusFood ? "Yes" : "No"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "calories",
    size: 130,
    meta: {
      label: "Calories",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Calories" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "energy",
    size: 130,
    meta: {
      label: "Energy",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Energy" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "protein",
    size: 130,
    meta: {
      label: "Protein",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Protein" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "fatTotal",
    size: 150,
    meta: {
      label: "Fat total",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Fat total" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "fatSaturated",
    size: 170,
    meta: {
      label: "Fat saturated",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Fat saturated" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "carbohydrate",
    size: 170,
    meta: {
      label: "Carbohydrate",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Carbohydrate" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "sugar",
    size: 130,
    meta: {
      label: "Sugar",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Sugar" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "dietaryFibre",
    size: 170,
    meta: {
      label: "Dietary fibre",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Dietary fibre" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
  {
    accessorKey: "sodium",
    size: 130,
    meta: {
      label: "Sodium",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Sodium" />
    ),
    sortingFn: metricSortingFn,
    cell: ({ getValue }) => <MetricCell value={getValue()} />,
  },
];

export function IngredientTable({
  rows,
}: {
  readonly rows: IngredientTableRow[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<"all" | "yes" | "no">(
    "all",
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (
        sourceFilter !== "all" &&
        (row.isAusFood ? "yes" : "no") !== sourceFilter
      ) {
        return false;
      }

      return matchesIngredientRow(row, searchQuery);
    });
  }, [rows, searchQuery, sourceFilter]);

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [searchQuery, sourceFilter]);

  React.useEffect(() => {
    const maxPageIndex =
      filteredRows.length === 0
        ? 0
        : Math.max(Math.ceil(filteredRows.length / pagination.pageSize) - 1, 0);

    if (pagination.pageIndex > maxPageIndex) {
      setPagination((current) => ({ ...current, pageIndex: maxPageIndex }));
    }
  }, [filteredRows.length, pagination.pageIndex, pagination.pageSize]);

  const handlePaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      setPagination((current) =>
        typeof updaterOrValue === "function"
          ? updaterOrValue(current)
          : updaterOrValue,
      );
    },
    [],
  );

  // oxlint-disable-next-line react-hooks-js/incompatible-library
  const table = useReactTable({
    data: filteredRows,
    columns,
    getRowId: (row) => String(row.id),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const filteredRowCount = filteredRows.length;
  const pageCount = filteredRowCount === 0 ? 0 : table.getPageCount();
  const currentPage = filteredRowCount === 0 ? 0 : pagination.pageIndex + 1;

  return (
    <div className="flex overflow-hidden flex-col p-4 h-full min-h-0 rounded-3xl border shadow-xl border-border/70 bg-card/70 shadow-black/10 backdrop-blur-sm">
      <div className="flex flex-wrap gap-3 justify-between items-start p-1 w-full">
        <div className="flex flex-wrap flex-1 gap-2 items-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search ingredients or nutrients"
            className={cn(
              "h-8 w-full min-w-56 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-sm",
              "dark:bg-input/30",
            )}
          />

          <Select
            value={sourceFilter}
            onValueChange={(value) =>
              setSourceFilter(value as "all" | "yes" | "no")
            }
          >
            <SelectTrigger className="min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="yes">Aus food</SelectItem>
              <SelectItem value="no">Custom</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || sourceFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSourceFilter("all");
              }}
            >
              Reset
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <div className="py-1.5 px-3 text-sm font-medium rounded-full border border-border/70 bg-background/70">
            {filteredRowCount} / {rows.length}
          </div>
          <CreateIngredientSheet />
        </div>
      </div>

      <div className="overflow-hidden flex-1 min-h-0 rounded-2xl border border-border/70 bg-background/40">
        <ScrollArea className="px-3 w-full h-full">
          <Table className="min-w-[78rem]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="sticky top-0 z-20 backdrop-blur-sm"
                      style={{
                        width: header.getSize(),
                        background: "var(--card)",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllLeafColumns().length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex flex-col-reverse gap-4 justify-between items-center p-1 w-full sm:flex-row sm:gap-8">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredRowCount} row(s)
        </div>

        <div className="flex flex-col-reverse gap-4 items-center sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex gap-2 items-center">
            <p className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </p>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => {
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(value),
                });
              }}
            >
              <SelectTrigger className="w-18">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 250].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium whitespace-nowrap">
            Page {currentPage} of {pageCount}
          </div>

          <div className="flex gap-2 items-center">
            <Button
              aria-label="Go to first page"
              variant="outline"
              size="icon-sm"
              className="hidden lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              size="icon-sm"
              className="hidden lg:flex"
              onClick={() =>
                table.setPageIndex(Math.max(table.getPageCount() - 1, 0))
              }
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ value }: { value: unknown }) {
  return (
    <div className="font-medium tabular-nums text-right">
      {formatMetric(value)}
    </div>
  );
}

function formatMetric(value: unknown) {
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    return normalizedValue || "-";
  }

  return "-";
}

function parseMetricNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  return null;
}
