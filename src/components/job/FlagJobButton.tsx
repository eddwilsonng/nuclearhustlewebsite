"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { FlagJobModal } from "./FlagJobModal";
import { Button } from "@/components/ui/Button";

interface FlagJobButtonProps {
  jobSlug: string;
}

export function FlagJobButton({ jobSlug }: FlagJobButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="quiet"
        size="compact"
        aria-label="Flag this listing"
      >
        <Flag size={16} aria-hidden="true" />
        Flag listing
      </Button>
      <FlagJobModal jobSlug={jobSlug} open={open} onOpenChange={setOpen} />
    </>
  );
}
