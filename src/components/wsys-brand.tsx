import { cn } from '@/lib/utils'

export function WsysBrand({
  className,
  product = 'Aus Food Label',
  caption,
  compact = false,
}: {
  readonly className?: string
  readonly product?: string
  readonly caption?: string
  readonly compact?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-[1.25rem] border border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_42%),linear-gradient(135deg,rgba(213,112,45,0.98),rgba(87,34,8,0.95))] text-primary-foreground shadow-lg shadow-black/20',
          compact ? 'size-10' : 'size-12',
        )}
      >
        <span
          className={cn(
            'font-black tracking-[0.24em] uppercase',
            compact ? 'pl-1 text-[0.62rem]' : 'pl-1 text-[0.72rem]',
          )}
        >
          WSYS
        </span>
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            'font-semibold tracking-[0.38em] text-primary/80 uppercase',
            compact ? 'text-[0.58rem]' : 'text-[0.65rem]',
          )}
        >
          WSYS
        </p>
        <p
          className={cn(
            'truncate font-medium tracking-tight text-foreground',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {product}
        </p>
        {caption ? (
          <p className={cn('truncate text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  )
}
