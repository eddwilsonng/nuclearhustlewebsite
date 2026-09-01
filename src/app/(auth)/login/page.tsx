import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthError } from "@/components/auth/AuthShared";

export const metadata = {
  title: "Log In - Nuclear Hustle",
  description: "Log in to your Nuclear Hustle account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirect = params.redirect;
  const error = params.error;
  const signupHref = redirect
    ? `/signup?redirect=${encodeURIComponent(redirect)}`
    : "/signup";

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Welcome back.
      </h1>
      <p className="mb-8 font-mono text-xs uppercase tracking-widest text-secondary">
        Sign in to your account
      </p>

      {error && (
        <div className="mb-6">
          <AuthError>{error}</AuthError>
        </div>
      )}

      <LoginForm redirect={redirect} />

      <p className="mt-8 font-sans text-sm text-secondary">
        No account?{" "}
        <Link href={signupHref} className="font-semibold text-ink underline underline-offset-2">
          Sign up →
        </Link>
      </p>
    </div>
  );
}
