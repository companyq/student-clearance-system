import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

/**
 * Privileged connection using the SERVICE ROLE key. It bypasses Row-Level
 * Security, so it is only used on the server for creating login accounts
 * (student registration, admin adding users, password resets), and only
 * after the code has checked that the caller is allowed to do so.
 * "server-only" makes the build fail if a browser component ever imports it.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.");
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
