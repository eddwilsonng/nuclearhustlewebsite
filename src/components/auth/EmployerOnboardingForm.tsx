"use client";

import { useActionState } from "react";
import { completeGoogleEmployerProfile, type ActionState } from "@/lib/auth/actions";

export function EmployerOnboardingForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    completeGoogleEmployerProfile,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="p-3 font-mono text-xs text-red-600 border border-red-200 bg-red-50">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="companyName" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
          Company Name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          className="w-full px-3 py-2 border border-[#CFC8BC] font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors"
          placeholder="Acme Nuclear Inc."
        />
      </div>

      <div>
        <label htmlFor="companyWebsite" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
          Company Website <span className="normal-case text-stone-600">(optional)</span>
        </label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="url"
          className="w-full px-3 py-2 border border-[#CFC8BC] font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors"
          placeholder="https://company.com"
        />
      </div>

      <div>
        <label htmlFor="companyDescription" className="block font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">
          Company Description <span className="normal-case text-stone-600">(optional)</span>
        </label>
        <textarea
          id="companyDescription"
          name="companyDescription"
          rows={3}
          className="w-full px-3 py-2 border border-[#CFC8BC] font-mono text-sm focus:outline-none focus:border-yellow-400 transition-colors resize-none"
          placeholder="Brief description of your company..."
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-200 text-stone-900 font-mono text-xs tracking-widest uppercase font-bold transition-colors"
      >
        {isPending ? "Saving..." : "Complete Setup →"}
      </button>
    </form>
  );
}
