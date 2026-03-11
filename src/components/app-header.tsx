import {
  RiFileList3Line,
  RiLoader4Line,
  RiMoonClearLine,
  RiSunLine,
  RiUser3Line,
} from '@remixicon/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useTheme } from '@/components/theme-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import authClient from '@/lib/auth/auth-client'
import { authQueryOptions } from '@/lib/auth/queries'
import { cn } from '@/lib/utils'

export function AppHeader({ className }: { readonly className?: string }) {
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const router = useRouter()
  const location = useLocation()
  const { data: user } = useQuery(authQueryOptions())
  const [isSigningOut, setIsSigningOut] = useState(false)

  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const themeLabel = nextTheme === 'dark' ? 'Dark mode' : 'Light mode'
  const isIngredientRoute = location.pathname.startsWith('/ingredient')

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await authClient.signOut({
        fetchOptions: {
          onResponse: async () => {
            queryClient.setQueryData(authQueryOptions().queryKey, null)
            await router.invalidate()
          },
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.'
      toast.error(message)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-full border border-border/70 bg-card/70 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm',
        className,
      )}
    >
      <Link to={user ? '/app' : '/'} className="min-w-0">
        <p className="text-xs font-medium tracking-[0.35em] text-primary/80 uppercase">
          Aus Food Label
        </p>
        <p className="truncate text-sm text-muted-foreground">
          Ingredients, labels, and nutrition data.
        </p>
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {user ? (
          <Link
            to="/ingredient"
            className={buttonVariants({
              variant: isIngredientRoute ? 'default' : 'outline',
              size: 'sm',
              className: 'h-10 rounded-full px-3',
            })}
          >
            <RiFileList3Line className="size-4" />
            <span className="hidden sm:inline">Ingredients</span>
          </Link>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-full px-3"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Switch to ${themeLabel.toLowerCase()}`}
        >
          {nextTheme === 'dark' ? (
            <RiMoonClearLine className="size-4" />
          ) : (
            <RiSunLine className="size-4" />
          )}
          <span className="hidden sm:inline">{themeLabel}</span>
        </Button>

        {user ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full px-2.5 sm:px-3"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
          >
            <UserAvatar
              image={user.image}
              fallback={getUserFallback(user.name, user.email)}
              signedIn
            />
            <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
            {isSigningOut && <RiLoader4Line className="size-4 animate-spin" />}
          </Button>
        ) : (
          <Link
            to="/login"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'h-10 rounded-full px-2.5 sm:px-3',
            })}
            aria-label="Sign in"
          >
            <UserAvatar fallback="guest" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        )}
      </div>
    </header>
  )
}

function UserAvatar({
  image,
  fallback,
  signedIn = false,
}: {
  image?: string | null
  fallback: string
  signedIn?: boolean
}) {
  return (
    <Avatar size="sm" className={cn('bg-muted/70', signedIn && 'bg-primary/10')}>
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback className="bg-transparent font-medium text-foreground">
        {fallback.length <= 2 ? fallback : <RiUser3Line className="size-3.5" />}
      </AvatarFallback>
    </Avatar>
  )
}

function getUserFallback(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim()

  if (!source) {
    return 'AU'
  }

  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length > 1) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}
