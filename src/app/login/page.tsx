import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { dashboardFor, getAppUser } from "@/lib/auth";
import { Notice } from "@/components/notice";
import { AuthLayout } from "@/components/auth-layout";
import LoginForm from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const sp = await searchParams;

  // Already logged in: go straight to the dashboard
  const user = await getAppUser();
  if (user?.isActive) redirect(dashboardFor(user.role));

  // Only an admission number in the expected format is echoed back
  const registered = sp.registered && /^\d{2}-\d{4}$/.test(sp.registered) ? sp.registered : "";

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="muted mb-7 mt-1.5">Log in to continue to your clearance dashboard.</p>

      {!isSupabaseConfigured && (
        <Notice kind="bad">Supabase is not configured. Fill in .env.local (see SETUP.md).</Notice>
      )}
      {registered && (
        <Notice kind="ok">
          <strong>Registration successful.</strong> Your username is your admission number: {registered}
        </Notice>
      )}
      {sp.error === "disabled" && (
        <Notice kind="warn">This account has been deactivated. Please contact the system administrator.</Notice>
      )}

      <LoginForm username={registered} />
    </AuthLayout>
  );
}
