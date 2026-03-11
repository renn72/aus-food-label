import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/app/')({
  component: AppIndex,
})

function AppIndex() {
  const { user } = Route.useRouteContext()

  return (
    <section className="grid gap-6">
      <div className="space-y-3">
        <p className="text-xs font-medium tracking-[0.3em] text-primary/80 uppercase">Signed in</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Welcome back{user.name ? `, ${user.name}` : ''}.
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          The boilerplate placeholder has been removed. This is now a clean protected shell you can
          build on for ingredients, labels, and application workflows.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-2 text-lg font-medium">{user.email}</p>
      </div>
    </section>
  )
}
