import { EmployerOnboardingForm } from "@/components/auth/EmployerOnboardingForm";

export const metadata = {
  title: "Company Details - Nuclear Hustle",
};

export default function EmployerOnboardingPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Almost there.
      </h1>
      <p className="mb-8 font-mono text-xs uppercase tracking-widest text-secondary">
        Tell us about your company
      </p>

      <EmployerOnboardingForm />
    </div>
  );
}
