import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";

export function withProviders(ui: ReactNode) {
  return <ToastProvider>{ui}</ToastProvider>;
}
