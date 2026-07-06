import { EmployerOnboardingForm } from "@/components/auth/EmployerOnboardingForm";

export const metadata = {
  title: "Company Details - Nuclear Hustle",
};

export default function EmployerOnboardingPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-2">
        Almost there.
      </h1>
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-8">
        Tell us about your company
      </p>

      <EmployerOnboardingForm />
    </div>
  );
}
