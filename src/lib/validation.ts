// Input validation rules (same rules as the VB.NET Validator class).
// Each function returns an error message, or null when the value is valid.
// Used by the server actions, so the rules apply no matter what the browser sends.

/** Daystar admission number: two digits, a dash, four digits (e.g. 24-1516). */
export function checkAdmNo(value: string): string | null {
  if (!value.trim()) return "Admission number is required.";
  if (!/^\d{2}-\d{4}$/.test(value.trim())) {
    return "Admission number must look like 24-1516 (2 digits, dash, 4 digits).";
  }
  return null;
}

export function checkRequired(value: string, fieldName: string): string | null {
  return value.trim() ? null : `${fieldName} is required.`;
}

/** Email is optional, but if entered it must be a valid format. */
export function checkEmail(value: string): string | null {
  if (!value.trim()) return null;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim()) ? null : "Email address is not valid.";
}

/** Phone is optional; if entered: digits only, optional leading +, 10 to 13 digits. */
export function checkPhone(value: string): string | null {
  if (!value.trim()) return null;
  return /^\+?\d{10,13}$/.test(value.trim()) ? null : "Phone number must be 10-13 digits, e.g. 0712345678.";
}

export function checkPassword(password: string, confirm: string): string | null {
  if (password.length < 6) return "Password must be at least 6 characters.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/** Usernames for staff accounts: letters, digits, dot, dash, underscore. */
export function checkUsername(value: string): string | null {
  if (!value.trim()) return "Username is required.";
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(value.trim())) {
    return "Username must be 3-30 characters: letters, numbers, dot, dash or underscore.";
  }
  return null;
}

/** The first error from a list of checks, or null if all passed. */
export function firstError(...results: (string | null)[]): string | null {
  return results.find((r) => r !== null) ?? null;
}
