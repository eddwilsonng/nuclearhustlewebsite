import { EmployerOnboardingForm } from "@/components/auth/EmployerOnboardingForm";

export const metadata = {
  title: "Company Details - Nuclear Hustle",
};

export default function EmployerOnboardingPage() {
  return (
    <div className="w-full max-w-md">
      <h1 className="font-mono text-2xl font-bold text-gray-900 mb-2">
        Almost there.
      </h1>
      <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-8">
        Tell us about your company
      </p>

      <EmployerOnboardingForm />
    </div>
  );
}
