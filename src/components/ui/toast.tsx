"use client";

// Toast — ported from primitives.jsx (ToastProvider / useToast).

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Icon } from "./icon";

export interface ToastInput {
  icon?: string;
  text: string;
  tone?: string;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: string;
}

type PushToast = (toast: ToastInput) => void;

const ToastContext = createContext<PushToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback<PushToast>((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fx-rise"
            style={{
              background: T.navy,
              color: T.white,
              padding: "12px 16px",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(2,0,64,0.16)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: 500,
              pointerEvents: "auto",
              maxWidth: 380,
            }}
          >
            <Icon name={t.icon || "check"} size={16} color={t.tone === "coral" ? T.coral : "#fff"} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): PushToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
