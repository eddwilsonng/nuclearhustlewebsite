"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeatureDialog } from "../../JobActions";
import { featuredPriceLabel } from "@/lib/jobs/featuredOffer";

export function FeatureOfferButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Feature it for {featuredPriceLabel()}
      </Button>
      <FeatureDialog jobId={jobId} open={open} onOpenChange={setOpen} />
    </>
  );
}
