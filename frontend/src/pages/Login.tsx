import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAssetFlowStore } from "../store/assetFlowStore";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).optional()
});

type AuthForm = z.infer<typeof authSchema>;

export function Login() {
  const setActiveView = useAssetFlowStore((state) => state.setActiveView);
  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "anika@assetflow.local", password: "password" }
  });

  const signIn = form.handleSubmit(async ({ email, password }) => {
    if (!supabase) {
      setActiveView("dashboard");
      return;
    }

    await supabase.auth.signInWithPassword({ email, password });
    setActiveView("dashboard");
  });

  const signUp = form.handleSubmit(async ({ email, password, fullName }) => {
    if (!supabase) {
      setActiveView("dashboard");
      return;
    }

    await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  });

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
      <Card className="rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold tracking-tight">Workspace Access</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">Email/password auth with employee-only signup defaults.</p>
        <form className="mt-6 grid gap-5" onSubmit={signIn}>
          <Field label="Full name">
            <Input placeholder="New signup only" {...form.register("fullName")} />
          </Field>
          <Field label="Email">
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Password">
            <Input type="password" {...form.register("password")} />
          </Field>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" title="Sign in">
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
            <Button type="button" variant="secondary" title="Create employee account" onClick={signUp}>
              <UserPlus className="h-4 w-4" /> Sign Up
            </Button>
            <Button type="button" variant="ghost" title="Magic link">
              <Mail className="h-4 w-4" /> Magic Link
            </Button>
          </div>
        </form>
      </Card>
      <div className="rounded-2xl border border-border bg-white p-8 shadow-lg">
        <h3 className="text-xl font-bold">Auth State</h3>
        <Notice
          tone={isSupabaseConfigured ? "success" : "warning"}
          message={isSupabaseConfigured ? "Supabase auth variables are configured." : "Demo mode is active until Supabase env values are added."}
        />
        <div className="mt-4 grid gap-3 text-base text-muted">
          <div>Signup creates an Employee profile through the database trigger.</div>
          <div>Role changes are restricted to Admins inside Organization.</div>
          <div>API routes require Supabase JWT bearer tokens.</div>
        </div>
      </div>
    </div>
  );
}
