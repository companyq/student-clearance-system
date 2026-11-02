// Settings read from .env.local (see .env.local.example).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the Supabase URL and public key have been filled in. */
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const APP_NAME = "Student Clearance System";
export const UNIVERSITY = "Daystar University";

/**
 * Supabase Auth logs people in with an email address, but this system uses
 * usernames (students use their admission number). Each username is turned
 * into an internal address on this domain; users never see or type it.
 */
export const LOGIN_EMAIL_DOMAIN = "clearance.local";
