import type { ReactNode } from 'react'

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_30%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background),black_5%))] px-4 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
    </div>
  )
}
