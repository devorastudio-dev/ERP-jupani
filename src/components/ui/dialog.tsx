"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-h-[92vh] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl",
          className,
        )}
        {...props}
      >
        <div className="max-h-[92vh] overflow-y-auto px-6 pb-6 pt-6">
          {children}
        </div>
        <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-stone-500 shadow-sm shadow-rose-100/60 hover:bg-rose-50">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function DialogTitle(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className="text-lg font-semibold text-stone-900" {...props} />;
}

export function DialogDescription(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className="text-sm text-stone-500" {...props} />;
}
