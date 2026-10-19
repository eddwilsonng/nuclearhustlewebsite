export function TermsAcceptance({
  id,
  checked,
  onChange,
  detail,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <div className="font-sans text-sm leading-relaxed text-secondary">
        <label htmlFor={id} className="text-ink">
          {detail ??
            "I agree to the Terms of Service and the Privacy Policy."}
        </label>{" "}
        <a href="/terms" className="text-ink underline underline-offset-2">
          Terms
        </a>
        {" · "}
        <a href="/privacy" className="text-ink underline underline-offset-2">
          Privacy
        </a>
      </div>
    </div>
  );
}
