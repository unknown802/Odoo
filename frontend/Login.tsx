import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogIn,
  ShieldCheck,
  UserPlus,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Badge } from "./src/components/ui/Badge";
import { Button } from "./src/components/ui/Button";
import { Card } from "./src/components/ui/Card";
import { Field, Input } from "./Field";
import { Notice } from "./Notice";
import { roleLabels } from "./src/lib/constants";
import { isSupabaseConfigured, supabase } from "./src/lib/supabase";
import { cn, passwordStrength, statusTone } from "./Utils";
import { useAssetFlowStore } from "./src/store/assetFlowStore";
import type { Role } from "./src/types";

type Mode = "signin" | "signup" | "reset";

const REMEMBERED_EMAIL_KEY = "assetflow.rememberedEmail";

const demoRoles: Role[] = ["Admin", "Asset_Manager", "Department_Head", "Employee"];

const ledgerPreview: Array<{ tag: string; name: string; status: string }> = [
  { tag: "AF-0114", name: "ThinkPad X1 Carbon", status: "Allocated" },
  { tag: "AF-0231", name: "Conference Room B2", status: "Reserved" },
  { tag: "AF-0089", name: "Forklift Unit 3", status: "Under_Maintenance" },
  { tag: "AF-0007", name: "Site Van 2", status: "Available" }
];

const kpiPreview = [
  { label: "Assets available", value: 128, icon: Boxes },
  { label: "Active bookings", value: 14, icon: CalendarClock },
  { label: "Maintenance today", value: 3, icon: Wrench }
];

function mapAuthError(message?: string) {
  if (!message) return "Something went wrong. Please try again.";
  if (/invalid login credentials/i.test(message)) {
    return "That email and password don't match. Try again or reset your password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirm your email before signing in — check your inbox for the verification link.";
  }
  if (/already registered|already exists|user already/i.test(message)) {
    return "An account already exists for that email. Try signing in instead.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Too many attempts. Wait a moment before trying again.";
  }
  return message;
}

function strengthColor(score: number) {
  if (score <= 1) return "bg-danger";
  if (score === 2) return "bg-accent";
  if (score === 3) return "bg-brand";
  return "bg-brand-dark";
}

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional()
});
type SignInForm = z.infer<typeof signInSchema>;

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });
type SignUpForm = z.infer<typeof signUpSchema>;

const resetSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address")
});
type ResetForm = z.infer<typeof resetSchema>;

function PasswordField({
  id,
  label,
  register,
  error,
  hint,
  autoComplete,
  autoFocus
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  hint?: string;
  autoComplete: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} id={id} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="pr-10"
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="focus-ring absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 transition hover:text-slate-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

function LedgerPanel() {
  return (
    <div className="bg-blueprint-grid relative hidden flex-col justify-between overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[hsl(184,84%,20%)] via-[hsl(178,68%,24%)] to-[hsl(222,47%,11%)] p-10 text-white shadow-soft lg:flex">
      <div className="animate-rise" style={{ animationDelay: "80ms" }}>
        <span className="text-xs font-semibold uppercase tracking-wide text-white/60">AssetFlow Enterprise</span>
        <h2 className="mt-2 text-2xl font-bold leading-snug">Every asset, always accounted for.</h2>
        <p className="mt-2 max-w-sm text-sm text-white/70">
          A sample look at what your team manages once signed in — from laptops to loading docks, tracked in real time.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2">
        {kpiPreview.map((stat, index) => {
          const Icon = stat.icon;
          const value = useCountUp(stat.value, 900 + index * 150);
          return (
            <div
              key={stat.label}
              className="animate-rise rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"
              style={{ animationDelay: `${160 + index * 90}ms` }}
            >
              <Icon className="h-4 w-4 text-white/70" />
              <div className="mt-2 text-xl font-bold tabular-nums">{value}</div>
              <div className="text-[11px] leading-tight text-white/60">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Recent activity</span>
        <div className="mt-3 grid gap-2">
          {ledgerPreview.map((item, index) => (
            <div
              key={item.tag}
              className="animate-rise flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              style={{ animationDelay: `${420 + index * 90}ms` }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 font-mono text-xs tabular-nums text-white/50">{item.tag}</span>
                <span className="truncate text-white/90">{item.name}</span>
              </div>
              <Badge tone={statusTone(item.status)} className="shrink-0 bg-white/15 text-white ring-white/20">
                {item.status.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="animate-rise mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/60" style={{ animationDelay: "820ms" }}>
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Role-based access. No self-assigned admins. Every action logged.
      </div>
    </div>
  );
}

export function Login() {
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);
  const setCurrentRole = useAssetFlowStore((state) => state.setCurrentRole);
  const profiles = useAssetFlowStore((state) => state.profiles);

  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const rememberedEmail = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "" : ""),
    []
  );

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: rememberedEmail, password: "", remember: Boolean(rememberedEmail) }
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" }
  });

  const signUpPassword = signUpForm.watch("password");
  const strength = passwordStrength(signUpPassword || "");

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
    setSignupDone(false);
    setResetSent(false);
  }

  const onSignIn = signInForm.handleSubmit(async ({ email, password, remember }) => {
    setFormError(null);

    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);

    if (!supabase) {
      setFormError("Demo mode — no backend connected. Choose a workspace persona below to explore AssetFlow.");
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setActiveView("dashboard");
    } catch (error) {
      setFormError(mapAuthError((error as Error).message));
    } finally {
      setPending(false);
    }
  });

  const onSignUp = signUpForm.handleSubmit(async ({ email, password, fullName }) => {
    setFormError(null);

    if (!supabase) {
      setFormError("Demo mode — no backend connected. Choose a workspace persona below to explore AssetFlow.");
      return;
    }

    setPending(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw error;
      setSignupDone(true);
    } catch (error) {
      setFormError(mapAuthError((error as Error).message));
    } finally {
      setPending(false);
    }
  });

  const onReset = resetForm.handleSubmit(async ({ email }) => {
    setFormError(null);

    if (!supabase) {
      setFormError("Demo mode — no backend connected. Choose a workspace persona below to explore AssetFlow.");
      return;
    }

    setPending(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    } finally {
      setPending(false);
      // Same neutral confirmation whether or not the email exists, to avoid revealing account existence.
      setResetSent(true);
    }
  });

  const heading = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const subheading =
    mode === "signin"
      ? "Sign in to manage assets, bookings, and audits."
      : mode === "signup"
        ? "New accounts start as an Employee — admins grant elevated roles afterward."
        : "We'll email you a secure link to set a new password.";

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <Card className="mx-auto w-full max-w-xl flex flex-col gap-6 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
            <p className="mt-2 text-base leading-relaxed text-muted">{subheading}</p>
          </div>
          {mode === "reset" ? (
            <Button variant="ghost" onClick={() => switchMode("signin")} title="Back to sign in" className="shrink-0 px-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : null}
        </div>

        {mode !== "reset" ? (
          <div role="tablist" aria-label="Authentication mode" className="inline-flex rounded-xl bg-slate-100 p-1.5">
            <button
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => switchMode("signin")}
              className={cn(
                "focus-ring rounded px-4 py-1.5 text-sm font-semibold transition",
                mode === "signin" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={cn(
                "focus-ring rounded px-4 py-1.5 text-sm font-semibold transition",
                mode === "signup" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Create account
            </button>
          </div>
        ) : null}

        <div aria-live="assertive">{formError ? <Notice tone="danger" message={formError} /> : null}</div>

        {mode === "signin" ? (
          <form onSubmit={onSignIn} noValidate className="grid gap-4">
            <Field label="Email" id="signin-email" error={signInForm.formState.errors.email?.message}>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                autoFocus
                aria-invalid={Boolean(signInForm.formState.errors.email)}
                {...signInForm.register("email")}
              />
            </Field>
            <PasswordField
              id="signin-password"
              label="Password"
              autoComplete="current-password"
              register={signInForm.register("password")}
              error={signInForm.formState.errors.password?.message}
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-medium text-slate-600">
                <input type="checkbox" className="focus-ring h-4 w-4 rounded border-border text-brand" {...signInForm.register("remember")} />
                Remember me
              </label>
              <button type="button" onClick={() => switchMode("reset")} className="focus-ring font-semibold text-brand hover:text-brand-dark">
                Forgot password?
              </button>
            </div>
            <Button type="submit" disabled={pending} className="mt-2 h-12 rounded-xl text-base font-semibold">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : null}

        {mode === "signup" ? (
          signupDone ? (
            <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Account created
              </div>
              <p>
                If email confirmation is required for this workspace, check your inbox to verify before signing in. Otherwise, you're
                ready to sign in now.
              </p>
              <Button variant="secondary" onClick={() => switchMode("signin")} className="w-fit">
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSignUp} noValidate className="grid gap-4">
              <Field label="Full name" id="signup-name" error={signUpForm.formState.errors.fullName?.message}>
                <Input id="signup-name" autoComplete="name" autoFocus {...signUpForm.register("fullName")} />
              </Field>
              <Field label="Email" id="signup-email" error={signUpForm.formState.errors.email?.message}>
                <Input id="signup-email" type="email" autoComplete="email" {...signUpForm.register("email")} />
              </Field>
              <PasswordField
                id="signup-password"
                label="Password"
                autoComplete="new-password"
                register={signUpForm.register("password")}
                error={signUpForm.formState.errors.password?.message}
                hint={!signUpForm.formState.errors.password ? "At least 8 characters. Mix in a number and a symbol for a stronger score." : undefined}
              />
              {signUpPassword ? (
                <div className="-mt-2 grid gap-1">
                  <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-slate-100">
                    {[0, 1, 2, 3].map((step) => (
                      <span
                        key={step}
                        className={cn("flex-1 rounded-full transition-colors", step < strength.score ? strengthColor(strength.score) : "bg-transparent")}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted">Password strength: {strength.label}</span>
                </div>
              ) : null}
              <PasswordField
                id="signup-confirm"
                label="Confirm password"
                autoComplete="new-password"
                register={signUpForm.register("confirmPassword")}
                error={signUpForm.formState.errors.confirmPassword?.message}
              />
              <Notice
                tone="info"
                message="New accounts start as Employee. An Admin can promote you to Asset Manager or Department Head from Organization Setup."
              />
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {pending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )
        ) : null}

        {mode === "reset" ? (
          <form onSubmit={onReset} noValidate className="grid gap-4">
            {resetSent ? (
              <Notice tone="success" message="If an account exists for that email, we've sent password reset instructions." />
            ) : (
              <>
                <p className="text-sm text-muted">Enter the email on your account and we'll send a secure link to reset your password.</p>
                <Field label="Email" id="reset-email" error={resetForm.formState.errors.email?.message}>
                  <Input id="reset-email" type="email" autoComplete="email" autoFocus {...resetForm.register("email")} />
                </Field>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {pending ? "Sending…" : "Send reset link"}
                </Button>
              </>
            )}
          </form>
        ) : null}

        {!isSupabaseConfigured ? (
          <div className="grid gap-3 border-t border-border pt-5">
            <Notice tone="warning" message="Demo mode — no Supabase backend connected. Explore AssetFlow instantly as any workspace role." />
            <div className="grid gap-3 sm:grid-cols-2">
              {demoRoles.map((role) => {
                const sample = profiles.find((candidate) => candidate.role === role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setCurrentRole(role);
                      setActiveView("dashboard");
                    }}
                    className="focus-ring flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left text-sm shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-teal-500 hover:shadow-md"
                  >
                    <span className="font-semibold text-ink">{roleLabels[role]}</span>
                    <span className="text-xs text-muted">{sample?.full_name ?? "Sample profile"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>

      <LedgerPanel />
    </div>
  );
}
