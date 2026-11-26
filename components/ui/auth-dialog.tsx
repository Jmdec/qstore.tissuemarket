"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

type FieldErrors = Record<string, string[]>;

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}) {
  const router = useRouter();

  const [loginSubmitting, setLoginSubmitting] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const [registerSubmitting, setRegisterSubmitting] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  const [registerFieldErrors, setRegisterFieldErrors] =
    React.useState<FieldErrors>({});

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data.message ?? "Invalid email or password.";
        setLoginError(message);
        toast.error("Log in failed", { description: message });
        return;
      }

      toast.success("Logged in successfully", {
        description: data.user?.first_name
          ? `Welcome back, ${data.user.first_name}!`
          : undefined,
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      const message = "Could not reach the server. Please try again.";
      setLoginError(message);
      toast.error("Log in failed", { description: message });
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);
    setRegisterFieldErrors({});
    setRegisterSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const payload = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      password,
      // Dialog has no separate confirm-password field, so mirror it here
      // to satisfy Laravel's `confirmed` validation rule.
      password_confirmation: password,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          setRegisterFieldErrors(data.errors as FieldErrors);
          toast.error("Please check the form", {
            description:
              "Some fields need to be fixed before you can continue.",
          });
        } else {
          const message =
            data.message ?? "Something went wrong. Please try again.";
          setRegisterError(message);
          toast.error("Registration failed", { description: message });
        }
        return;
      }

      toast.success("Account created", {
        description: "Welcome to Quanta Paper — you're all set.",
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      const message = "Could not reach the server. Please try again.";
      setRegisterError(message);
      toast.error("Registration failed", { description: message });
    } finally {
      setRegisterSubmitting(false);
    }
  }

  const fieldError = (field: string) => registerFieldErrors[field]?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex items-center gap-1.5 text-moss-700">
            <Leaf className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Quanta Paper
            </span>
          </div>
          <DialogTitle>Welcome back to the fold</DialogTitle>
          <DialogDescription>
            Sign in for order tracking, or create an account and get ₱100 off
            your first order.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {loginError && (
                <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {loginError}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={loginSubmitting}
              >
                {loginSubmitting ? "Logging in…" : "Log in"}
              </Button>
              {/* <p className="text-center text-xs text-muted-foreground">
                Forgot your password?{" "}
                <a href="#" className="underline">
                  Reset it
                </a>
              </p> */}
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {registerError && (
                <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {registerError}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first">First name</Label>
                  <Input
                    id="reg-first"
                    name="first_name"
                    required
                    placeholder="Juana"
                  />
                  {fieldError("first_name") && (
                    <p className="text-xs text-red-600">
                      {fieldError("first_name")}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last">Last name</Label>
                  <Input
                    id="reg-last"
                    name="last_name"
                    required
                    placeholder="Dela Cruz"
                  />
                  {fieldError("last_name") && (
                    <p className="text-xs text-red-600">
                      {fieldError("last_name")}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                />
                {fieldError("email") && (
                  <p className="text-xs text-red-600">{fieldError("email")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
                {fieldError("password") && (
                  <p className="text-xs text-red-600">
                    {fieldError("password")}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={registerSubmitting}
              >
                {registerSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
