import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      type="checkbox"
      role="switch"
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-6 w-11 rounded-full border border-rose-100 bg-white text-rose-500 outline-none ring-0 transition-colors duration-200 checked:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-300",
        className,
      )}
      {...props}
    />
  ),
);

Switch.displayName = "Switch";
