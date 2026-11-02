// Display helpers shared by the pages.

/** Formats a request ID as the reference shown to students, e.g. REQ-0007. */
export function requestRef(requestId: number): string {
  return `REQ-${String(requestId).padStart(4, "0")}`;
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Nairobi",
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Nairobi",
});

/** e.g. "02 Nov 2026, 14:30" in Nairobi time, or "" for empty values. */
export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : "";
}

export function formatDate(value: string | null | undefined): string {
  return value ? dateOnly.format(new Date(value)) : "";
}

/** True for ISO timestamps returned by Postgres (used to format report columns). */
export function looksLikeTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

/** Turns a database error into a short message for the user. */
export function friendlyDbError(action: string, error: { message?: string; code?: string } | null): string {
  if (!error) return `Something went wrong while trying to ${action}.`;
  // P0001 = a rule message raised on purpose by our own SQL functions
  if (error.code === "P0001" && error.message) return error.message;
  if (error.code === "42501") return "You are not allowed to do this.";
  return `A database error occurred while trying to ${action}.`;
}
