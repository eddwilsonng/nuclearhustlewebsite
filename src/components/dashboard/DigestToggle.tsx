"use client";

import { useState, useTransition } from "react";
import { setWeeklyDigest } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function DigestToggle({ subscribed: initial }: { subscribed: boolean }) {
  const [subscribed, setSubscribed] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-sans text-sm text-ink" aria-live="polite">
        {subscribed ? "On" : "Off"}
      </p>
      <Button
        variant="secondary"
        size="compact"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await setWeeklyDigest(!subscribed);
            if (result.error) {
              toast.error("Email settings not changed", result.error);
              return;
            }
            setSubscribed(!subscribed);
            if (result.message) toast.success(result.message);
          })
        }
      >
        {isPending ? "Saving…" : subscribed ? "Turn off" : "Turn on"}
      </Button>
    </div>
  );
}
