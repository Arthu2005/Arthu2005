"use client";

import { Button, Spinner } from "@/components/ui/Button";

export function SubmitButton({ pending, children, pendingLabel = "Enviando…" }: { pending: boolean; children: React.ReactNode; pendingLabel?: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Spinner /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
