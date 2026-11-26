"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useZeus } from "@/lib/store";

export function ToastBanner() {
  const { toast, dismissToast } = useZeus();
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-rose-500/50 bg-rose-950/90 text-rose-200"
      : toast.type === "success"
      ? "border-emerald-500/50 bg-emerald-950/90 text-emerald-200"
      : "border-blue-500/50 bg-slate-900/95 text-sky-200";

  const Icon =
    toast.type === "error" ? AlertTriangle : toast.type === "success" ? CheckCircle2 : Info;

  return (
    <div
      role="status"
      className={`fixed bottom-20 md:bottom-5 right-4 z-50 max-w-sm rounded-xl border px-3.5 py-2.5 shadow-2xl backdrop-blur flex items-start gap-2.5 text-xs ${tone}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">{toast.message}</div>
      <button
        type="button"
        onClick={dismissToast}
        aria-label="Fechar aviso"
        className="opacity-70 hover:opacity-100 shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
