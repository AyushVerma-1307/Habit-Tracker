"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title = "Delete this?",
  description = "This action cannot be undone.",
  onConfirm,
  confirmText = "Delete",
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-[425px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <DialogTitle className="text-xl">{title}</DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  {description}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-6 gap-3 sm:justify-center">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}