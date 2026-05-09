"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/lib/store";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg",
              {
                "border-green-500 bg-green-50 dark:bg-green-950":
                  toast.type === "success",
                "border-red-500 bg-red-50 dark:bg-red-950":
                  toast.type === "error",
                "border-gray-200 dark:border-gray-800": toast.type === "info",
              }
            )}
          >
            {toast.type === "success" && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            {toast.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}