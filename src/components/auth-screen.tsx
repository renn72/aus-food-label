import {
  RiDatabase2Line,
  RiFileList3Line,
  RiLoader4Line,
  RiLockPasswordLine,
} from "@remixicon/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WsysBrand } from "@/components/wsys-brand";
import authClient from "@/lib/auth/auth-client";
import { authQueryOptions } from "@/lib/auth/queries";

type AuthMode = "login" | "signup";

type AuthScreenProps = {
  defaultMode?: AuthMode;
  redirectUrl: string;
};

type FormSubmitEvent = Parameters<
  NonNullable<React.ComponentProps<"form">["onSubmit"]>
>[0];

export function AuthScreen({
  defaultMode = "login",
  redirectUrl,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      await authClient.signIn.email(
        {
          ...data,
          callbackURL: redirectUrl,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message || "Unable to sign in.");
          },
        },
      ),
  });

  const { mutate: signupMutate, isPending: isSignupPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
    }) => {
      await authClient.signUp.email(
        {
          ...data,
          callbackURL: redirectUrl,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message || "Unable to create your account.");
          },
          onSuccess: async () => {
            queryClient.removeQueries({
              queryKey: authQueryOptions().queryKey,
            });
            await navigate({ to: redirectUrl });
          },
        },
      );
    },
  });

  const isPending = isLoginPending || isSignupPending;

  const handleLoginSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    loginMutate({ email, password });
  };

  const handleSignupSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    signupMutate({ name, email, password });
  };

  return (
    <main className="overflow-hidden relative min-h-svh bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.42_0.1_45_/_0.35),transparent_34%),radial-gradient(circle_at_bottom_right,oklch(0.32_0.06_52_/_0.28),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),transparent)]" />
      <div className="flex relative flex-col py-6 px-6 mx-auto max-w-6xl sm:px-8 min-h-svh">
        <AppHeader />

        <div className="grid flex-1 gap-10 items-center py-10 lg:items-center lg:grid-cols-[minmax(0,1fr)_30rem]">
          <section className="space-y-8">
            <div className="space-y-4">
              <WsysBrand
                product="Aus Food Label"
                caption="WSYS nutrition workspace"
                className="max-w-md"
              />
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                WSYS keeps your ingredient data, auth flow, and label workspace
                in one place.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Aus Food Label runs inside the WSYS shell with a dark-first auth
                flow and a SQLite-backed ingredient stack.
              </p>
            </div>
          </section>

          <Card className="py-0 border shadow-2xl border-border/70 bg-card/85 shadow-black/30 backdrop-blur-sm">
            <CardHeader className="pb-5 border-b border-border/70">
              <CardTitle className="text-2xl">Access the app</CardTitle>
              <CardDescription>
                Sign in to the WSYS workspace or create a new Aus Food Label
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as AuthMode)}
                className="gap-6"
              >
                <TabsList className="grid grid-cols-2 w-full">
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
                    <Button
                      className="mt-2 w-full"
                      type="submit"
                      size="lg"
                      disabled={isPending}
                    >
                      {isLoginPending && (
                        <RiLoader4Line className="animate-spin" />
                      )}
                      {isLoginPending ? "Logging in..." : "Log in"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Need an account?{" "}
                      <button
                        type="button"
                        className="font-medium transition-opacity hover:opacity-80 text-primary"
                        onClick={() => setMode("signup")}
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
                      <Label htmlFor="signup-confirm-password">
                        Confirm password
                      </Label>
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
                    <Button
                      className="mt-2 w-full"
                      type="submit"
                      size="lg"
                      disabled={isPending}
                    >
                      {isSignupPending && (
                        <RiLoader4Line className="animate-spin" />
                      )}
                      {isSignupPending
                        ? "Creating account..."
                        : "Create account"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="font-medium transition-opacity hover:opacity-80 text-primary"
                        onClick={() => setMode("login")}
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
  );
}
