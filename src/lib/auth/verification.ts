import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificationCodeEmail } from "@/lib/email/templates/accountEmails";

// Employer email verification. Codes are six digits, live for 10 minutes,
// allow 5 wrong guesses, and can be resent once a minute (5 sends an hour).
// Only an HMAC of the code is stored, never the code itself.
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;

function hashCode(userId: string, code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for verification codes");
  return createHmac("sha256", secret).update(`email-verification:${userId}:${code}`).digest("hex");
}

export type VerificationStatus = {
  verified: boolean;
  email: string | null;
  /** When the last code went out, if one has. */
  lastSentAt: string | null;
};

export async function getVerificationStatus(userId: string): Promise<VerificationStatus> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_verifications")
    .select("email, verified_at, last_sent_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && /email_verifications/.test(error.message)) {
    // supabase/onboarding-migration.sql hasn't run, so the database doesn't
    // require verification either. Don't lock employers out in the meantime.
    console.warn("[verify] email_verifications table missing; treating employer as verified");
    return { verified: true, email: null, lastSentAt: null };
  }
  return {
    verified: Boolean(data?.verified_at),
    email: data?.email ?? null,
    lastSentAt: data?.last_sent_at ?? null,
  };
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  return (await getVerificationStatus(userId)).verified;
}

type Result = { ok: true } | { ok: false; error: string };

export async function sendVerificationCode(userId: string, email: string): Promise<Result> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("email_verifications")
    .select("verified_at, last_sent_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (row?.verified_at) return { ok: true };

  if (row?.last_sent_at && Date.now() - new Date(row.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "We just sent a code. Wait a minute before asking for another." };
  }

  const rateKey = `verify-email:${userId}`;
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key", rateKey)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "That's 5 codes this hour. Try again later, or contact us if the emails aren't arriving." };
  }
  await admin.from("rate_limits").insert({ key: rateKey });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  const { error: saveError } = await admin.from("email_verifications").upsert(
    {
      user_id: userId,
      email,
      code_hash: hashCode(userId, code),
      code_expires_at: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
      attempts: 0,
      last_sent_at: now.toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (saveError) {
    console.error("[verify] could not store code:", saveError.message);
    return { ok: false, error: "We couldn't create a code. Try again in a moment." };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[verify] code for ${email}: ${code}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true };

  const message = verificationCodeEmail(code);
  const { error: sendError } = await new Resend(apiKey).emails.send({
    from: "Nuclear Hustle <accounts@nuclearhustle.com>",
    replyTo: "nuclearhustle@gmail.com",
    to: email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (sendError) {
    console.error("[verify] send failed:", sendError.message);
    return { ok: false, error: "We couldn't send the email. Check the address, or try again in a minute." };
  }
  return { ok: true };
}

export async function checkVerificationCode(userId: string, code: string): Promise<Result> {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code from the email." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("email_verifications")
    .select("code_hash, code_expires_at, attempts, verified_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (row?.verified_at) return { ok: true };
  if (!row?.code_hash || !row.code_expires_at || new Date(row.code_expires_at).getTime() < Date.now()) {
    return { ok: false, error: "That code has expired. Send a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many incorrect tries. Send a new code." };
  }

  const expected = Buffer.from(row.code_hash);
  const actual = Buffer.from(hashCode(userId, code));
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await admin
      .from("email_verifications")
      .update({ attempts: row.attempts + 1 })
      .eq("user_id", userId);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    return {
      ok: false,
      error: left > 0
        ? `That code doesn't match. ${left} ${left === 1 ? "try" : "tries"} left.`
        : "Too many incorrect tries. Send a new code.",
    };
  }

  await admin
    .from("email_verifications")
    .update({ verified_at: new Date().toISOString(), code_hash: null, code_expires_at: null })
    .eq("user_id", userId);
  return { ok: true };
}
