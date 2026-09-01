"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-ink/45 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "card-raised fixed top-1/2 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-control bg-raised p-6 text-ink transition-[opacity,transform] duration-180 data-ending-style:translate-y-[calc(-50%+8px)] data-ending-style:opacity-0 data-starting-style:translate-y-[calc(-50%+8px)] data-starting-style:opacity-0",
            className,
          )}
        >
          <div className="pr-10">
            <Dialog.Title className="font-sans text-xl font-semibold tracking-tight text-ink">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="mt-2 font-sans text-sm leading-relaxed text-secondary">
                {description}
              </Dialog.Description>
            )}
          </div>
          <Dialog.Close
            aria-label="Close dialog"
            className="absolute top-4 right-4 inline-flex size-11 items-center justify-center border border-transparent text-secondary transition-colors duration-150 hover:border-rule hover:bg-surface hover:text-ink"
          >
            <X aria-hidden="true" size={18} />
          </Dialog.Close>
          <div className="mt-6">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
