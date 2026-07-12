import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail, UserPlus, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAssetFlowStore } from "../store/assetFlowStore";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  fullName: z.string().min(2, "Name must be at least 2 characters.").optional().or(z.literal(""))
});

type AuthForm = z.infer<typeof authSchema>;

export function Login() {
  const { login, signUp, isAuthLoading, authError } = useAssetFlowStore();
  const [signedUp, setSignedUp] = useState(false);

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", fullName: "" }
  });

  const { formState: { errors } } = form;

  const handleSignIn = form.handleSubmit(async ({ email, password }) => {
    await login(email, password);
  });

  const handleSignUp = form.handleSubmit(async ({ email, password, fullName }) => {
    await signUp(email, password, fullName ?? "");
    if (!authError) setSignedUp(true);
  });

  const handleMagicLink = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Enter your email first." });
      return;
    }
    // Magic link — Supabase OTP
    alert("Magic link flow coming soon.");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl flex flex-col lg:flex-row"
      >
        {/* Left Branded Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-dark to-brand p-10 text-white lg:w-5/12">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-black shadow-sm backdrop-blur-sm">
              AF
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight leading-none text-white">AssetFlow</div>
              <div className="text-[10px] font-bold tracking-[0.15em] text-white/70 uppercase mt-1">Enterprise</div>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">Streamline your<br/>asset operations.</h2>
            <p className="mt-4 text-brand-light leading-relaxed">
              Sign in to manage allocations, track maintenance, and monitor your entire organizational inventory from a single dashboard.
            </p>
            
            <div className="mt-8 flex items-center gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/10">
              <ShieldCheck className="h-6 w-6 text-brand-light" />
              <div className="text-sm">
                <div className="font-bold text-white">Enterprise Grade Security</div>
                <div className="text-white/70">SOC2 compliant infrastructure</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex flex-col justify-center p-8 lg:w-7/12 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h3>
              <p className="mt-2 text-sm text-muted">Enter your credentials to access your workspace.</p>
            </div>

            {/* Status banners */}
            {!isSupabaseConfigured && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-warning font-medium">Demo mode: authentication is bypassed.</p>
              </div>
            )}

            {authError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
                <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger font-medium">{authError}</p>
              </div>
            )}

            {signedUp && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-success font-medium">Account created! Check your email to confirm your account before signing in.</p>
              </div>
            )}

            <form className="grid gap-5" onSubmit={handleSignIn}>
              <Field label="Full name (for signup only)">
                <Input placeholder="John Doe" {...form.register("fullName")} className={errors.fullName ? "border-danger focus-ring" : ""} />
                {errors.fullName && <p className="text-xs font-medium text-danger mt-1.5">{errors.fullName.message}</p>}
              </Field>
              
              <Field label="Work Email">
                <Input type="email" placeholder="name@company.com" {...form.register("email")} className={errors.email ? "border-danger focus-ring" : ""} />
                {errors.email && <p className="text-xs font-medium text-danger mt-1.5">{errors.email.message}</p>}
              </Field>
              
              <Field label="Password">
                <Input type="password" placeholder="••••••••" {...form.register("password")} className={errors.password ? "border-danger focus-ring" : ""} />
                {errors.password && <p className="text-xs font-medium text-danger mt-1.5">{errors.password.message}</p>}
              </Field>

              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="submit" title="Sign in" className="w-full" disabled={isAuthLoading}>
                  <LogIn className="h-4 w-4" /> {isAuthLoading ? "Signing in..." : "Sign In"}
                </Button>
                <Button type="button" variant="secondary" title="Create account" onClick={handleSignUp} className="w-full" disabled={isAuthLoading}>
                  <UserPlus className="h-4 w-4" /> Sign Up
                </Button>
              </div>

              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs font-medium">
                  <span className="bg-surface px-4 text-muted">Or continue with</span>
                </div>
              </div>

              <Button type="button" variant="ghost" title="Magic link" className="w-full border border-border mt-2 bg-surface" onClick={handleMagicLink}>
                <Mail className="h-4 w-4" /> Sign in with Magic Link
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
