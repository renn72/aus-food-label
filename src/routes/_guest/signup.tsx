import { createFileRoute } from '@tanstack/react-router'

import { AuthScreen } from '@/components/auth-screen'

export const Route = createFileRoute('/_guest/signup')({
  component: SignupForm,
})

function SignupForm() {
  const { redirectUrl } = Route.useRouteContext()

  return <AuthScreen defaultMode="signup" redirectUrl={redirectUrl} />
}
