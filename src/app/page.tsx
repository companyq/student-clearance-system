import { redirect } from "next/navigation";
import { dashboardFor, getAppUser } from "@/lib/auth";

/** The home address sends people to their dashboard, or to the login page. */
export default async function Home() {
  const user = await getAppUser();
  redirect(user?.isActive ? dashboardFor(user.role) : "/login");
}
