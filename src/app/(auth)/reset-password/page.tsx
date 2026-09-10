import Link from "next/link";
import { getUser } from "@/lib/auth/actions";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Choose a new password — Nuclear Hustle",
};

export default async function ResetPasswordPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="w-full max-w-md">
        <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
          Link expired.
        </h1>
        <p className="mb-8 font-sans text-sm text-secondary">
          This reset link is invalid or has already been used. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="font-sans text-sm font-semibold text-ink underline underline-offset-2"
        >
          Request a new link →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Choose a new password.
      </h1>
      <p className="mb-8 font-mono text-xs uppercase tracking-widest text-secondary">
        Then you can sign in as usual
      </p>

      <ResetPasswordForm />
    </div>
  );
}
