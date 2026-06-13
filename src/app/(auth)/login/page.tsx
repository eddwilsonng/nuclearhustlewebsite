import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

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

  return (
    <div className="w-full max-w-md">
      <h1 className="font-mono text-2xl font-bold text-stone-900 mb-2">Welcome back.</h1>
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-8">Sign in to your account</p>

      {error && (
        <div className="mb-6 p-3 font-mono text-xs text-red-600 border border-red-200 bg-red-50">
          {error}
        </div>
      )}

      <LoginForm redirect={redirect} />

      <p className="mt-8 font-mono text-xs tracking-widest uppercase text-stone-400">
        No account?{" "}
        <Link href="/signup" className="text-stone-900 hover:text-yellow-600 transition-colors">
          Sign up →
        </Link>
      </p>
    </div>
  );
}
