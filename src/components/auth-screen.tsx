import {
  RiDatabase2Line,
  RiFileList3Line,
  RiLoader4Line,
  RiLockPasswordLine,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import authClient from '@/lib/auth/auth-client'
import { authQueryOptions } from '@/lib/auth/queries'

type AuthMode = 'login' | 'signup'

type AuthScreenProps = {
  defaultMode?: AuthMode
  redirectUrl: string
}

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]

export function AuthScreen({ defaultMode = 'login', redirectUrl }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      await authClient.signIn.email(
        {
          ...data,
          callbackURL: redirectUrl,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message || 'Unable to sign in.')
          },
        },
      ),
  })

  const { mutate: signupMutate, isPending: isSignupPending } = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      await authClient.signUp.email(
        {
          ...data,
          callbackURL: redirectUrl,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message || 'Unable to create your account.')
          },
          onSuccess: async () => {
            queryClient.removeQueries({ queryKey: authQueryOptions().queryKey })
            await navigate({ to: redirectUrl })
          },
        },
      )
    },
  })

  const isPending = isLoginPending || isSignupPending

  const handleLoginSubmit = (event: FormSubmitEvent) => {
    event.preventDefault()
    if (isPending) return

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) return

    loginMutate({ email, password })
  }

  const handleSignupSubmit = (event: FormSubmitEvent) => {
    event.preventDefault()
    if (isPending) return

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!name || !email || !password || !confirmPassword) return

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    signupMutate({ name, email, password })
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.42_0.1_45_/_0.35),transparent_34%),radial-gradient(circle_at_bottom_right,oklch(0.32_0.06_52_/_0.28),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),transparent)]" />
      <div className="relative mx-auto flex min-h-svh max-w-6xl items-center px-6 py-10 sm:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-medium tracking-[0.35em] text-primary/80 uppercase">
                Aus Food Label
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Sign in to manage ingredients and build from a clean starting point.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Dark by default, no template splash screen, and a focused auth entry for the
                SQLite-backed app.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                <RiLockPasswordLine className="size-5 text-primary" />
                <p className="mt-4 font-medium">Email auth</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Login and signup without the social boilerplate.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                <RiDatabase2Line className="size-5 text-primary" />
                <p className="mt-4 font-medium">SQLite first</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drizzle is wired for your local SQLite workflow.
                </p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm">
                <RiFileList3Line className="size-5 text-primary" />
                <p className="mt-4 font-medium">Ingredient ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The app schema already includes your ingredient tables.
                </p>
              </div>
            </div>
          </section>

          <Card className="border border-border/70 bg-card/85 py-0 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-2xl">Access the app</CardTitle>
              <CardDescription>
                Use one screen for returning users and new accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as AuthMode)}
                className="gap-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Log in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form className="grid gap-5" onSubmit={handleLoginSubmit}>
                    <div className="grid gap-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="hello@example.com"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <Button className="mt-2 w-full" type="submit" size="lg" disabled={isPending}>
                      {isLoginPending && <RiLoader4Line className="animate-spin" />}
                      {isLoginPending ? 'Logging in...' : 'Log in'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Need an account?{' '}
                      <button
                        type="button"
                        className="font-medium text-primary transition-opacity hover:opacity-80"
                        onClick={() => setMode('signup')}
                      >
                        Create one
                      </button>
                    </p>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form className="grid gap-5" onSubmit={handleSignupSubmit}>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="hello@example.com"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-confirm-password">Confirm password</Label>
                      <Input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        readOnly={isPending}
                        required
                      />
                    </div>
                    <Button className="mt-2 w-full" type="submit" size="lg" disabled={isPending}>
                      {isSignupPending && <RiLoader4Line className="animate-spin" />}
                      {isSignupPending ? 'Creating account...' : 'Create account'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="font-medium text-primary transition-opacity hover:opacity-80"
                        onClick={() => setMode('login')}
                      >
                        Log in
                      </button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
