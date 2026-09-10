import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset password — Nuclear Hustle",
  description: "Request a password reset for your Nuclear Hustle account",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Reset your password.
      </h1>
      <p className="mb-8 font-mono text-xs uppercase tracking-widest text-secondary">
        We&apos;ll email you a reset link
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 font-sans text-sm text-secondary">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          Log in →
        </Link>
      </p>
    </div>
  );
}
