import { cn } from "@/lib/utils";

export function WsysBrand({
  className,
  product = "Aus Food Label",
  caption,
  compact = false,
}: {
  readonly className?: string;
  readonly product?: string;
  readonly caption?: string;
  readonly compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold tracking-[0.38em] text-primary/80 uppercase",
            compact ? "text-[0.58rem]" : "text-[0.65rem]",
          )}
        >
          WSYS
        </p>
        <p
          className={cn(
            "truncate font-medium tracking-tight text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          {product}
        </p>
        {caption ? (
          <p
            className={cn(
              "truncate text-muted-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
