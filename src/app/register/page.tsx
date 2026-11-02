import { redirect } from "next/navigation";
import { dashboardFor, getAppUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth-layout";
import RegisterForm from "./register-form";

export const metadata = { title: "Register" };

/** DFD 1.0 Register Student (self-registration from the login page). */
export default async function RegisterPage() {
  const user = await getAppUser();
  if (user?.isActive) redirect(dashboardFor(user.role));

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight">Create your student account</h1>
      <p className="muted mb-6 mt-1.5">Fields marked * are required. You&apos;ll log in with your admission number.</p>
      <RegisterForm />
    </AuthLayout>
  );
}
