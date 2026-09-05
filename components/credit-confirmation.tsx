"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Native modal semantics provide focus trapping, inert background and Escape.
// The presentation and all copy remain owned by Housora.
export function WorkspaceDialog({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} className={`workspace-dialog${wide ? " workspace-dialog-wide" : ""}`} aria-label={title}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="workspace-dialog-header"><h2>{title}</h2><button autoFocus onClick={onClose} aria-label="Close dialog"><X aria-hidden size={20} /></button></header>
    {children}
  </dialog>;
}

export function CreditConfirmation({ open, cost, title, description, action, onCancel, onConfirm }: {
  open: boolean; cost: number; title: string; description: string; action: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  const balance = useQuery(api.credits.getMyBalance, {});
  const enough = balance !== undefined && balance.total >= cost;
  return <WorkspaceDialog open={open} onClose={onCancel} title={title}>
    <div className="credit-confirm-body"><p>{description}</p>
      <dl><div><dt>Cost</dt><dd>{cost} Housora {cost === 1 ? "credit" : "credits"}</dd></div>
        <div><dt>Your balance</dt><dd>{balance ? `${balance.total} credits` : "Loading…"}</dd></div>
        {enough && balance ? <div><dt>After this action</dt><dd>{balance.total - cost} credits</dd></div> : null}</dl>
      <p className="credit-confirm-hint">Nothing is sent or charged until you confirm.</p>
      {balance && !enough ? <p role="alert">Not enough credits. Open Pricing to add credits.</p> : null}
    </div>
    <footer><button onClick={onCancel}>Cancel</button><button className="primary-action" disabled={!enough} onClick={onConfirm}>{action} · {cost} {cost === 1 ? "credit" : "credits"}</button></footer>
  </WorkspaceDialog>;
}
