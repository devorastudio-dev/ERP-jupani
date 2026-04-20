import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-rose-300",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
