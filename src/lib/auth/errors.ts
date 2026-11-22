// Supabase and Postgres errors are written for developers. Map the ones people
// actually hit to plain copy, and log the raw message for us.
const KNOWN_ERRORS: [RegExp, string][] = [
  [/user already registered|already been registered/i, "An account with this email already exists. Log in instead, or reset your password."],
  [/invalid login credentials/i, "That email and password don't match an account. Check both, or reset your password."],
  [/email not confirmed/i, "Confirm your email address before you log in."],
  [/password should be at least|password is too short/i, "Use a password of at least 8 characters."],
  [/pwned|weak password|known to be weak/i, "That password appears in known data breaches. Choose a different one."],
  [/should be different from the old password|same password/i, "Choose a password you haven't used on this account before."],
  [/rate limit|too many requests|over_email_send_rate_limit/i, "Too many attempts in a short time. Wait a minute and try again."],
  [/unable to validate email|invalid email/i, "Enter a valid email address."],
  [/row-level security/i, "We couldn't save that to your account. Refresh the page and try again."],
  [/duplicate key value/i, "That's already saved on your account."],
  [/payload too large|exceeded the maximum allowed size/i, "That file is too large."],
];

export function friendlyError(
  message: string | null | undefined,
  fallback = "Something went wrong on our side. Try again in a moment.",
): string {
  if (!message) return fallback;
  for (const [pattern, copy] of KNOWN_ERRORS) {
    if (pattern.test(message)) return copy;
  }
  console.error("[auth] unmapped error:", message);
  return fallback;
}
