"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      theme="dark"
      toastOptions={{
        className:
          "!border !border-zinc-800 !bg-zinc-950 !text-zinc-100 !shadow-2xl",
      }}
    />
  );
}
