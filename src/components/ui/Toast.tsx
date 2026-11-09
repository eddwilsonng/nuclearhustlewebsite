"use client";

import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { cn } from "@/lib/cn";

/**
 * Transient confirmation for an action the user just took ("Profile saved").
 * Toasts never carry the only record of an error: forms keep their inline
 * error too. F6 moves focus into the viewport region.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={5000} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 left-4 z-[90] flex flex-col gap-2 outline-none sm:left-auto sm:w-96">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "card-raised border border-l-4 border-control bg-raised text-ink transition-opacity duration-150 data-ending-style:opacity-0 data-limited:hidden data-starting-style:opacity-0",
        toast.type === "error" ? "border-l-danger" : "border-l-ink",
      )}
    >
      <Toast.Content className="flex items-start gap-3 py-3 pr-2 pl-4">
        <div className="min-w-0 flex-1 py-1">
          <Toast.Title className="font-sans text-sm font-semibold text-ink" />
          <Toast.Description className="mt-1 font-sans text-sm leading-relaxed text-secondary" />
        </div>
        <Toast.Close
          aria-label="Dismiss notification"
          className="inline-flex min-h-11 shrink-0 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
        >
          Dismiss
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

export function useToast() {
  const manager = Toast.useToastManager();
  return {
    success(title: string, description?: string) {
      manager.add({ title, description, type: "success" });
    },
    error(title: string, description?: string) {
      manager.add({ title, description, type: "error", priority: "high", timeout: 8000 });
    },
  };
}
