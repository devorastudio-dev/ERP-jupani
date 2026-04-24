import clsx from "clsx";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "featured" | "favorite" | "default";
};

export const Badge = ({ variant = "default", className, ...props }: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
      variant === "featured" && "bg-[#f3b59d] text-[#4b2c24]",
      variant === "favorite" && "bg-[#fde2d7] text-[#7b3b30]",
      variant === "default" && "bg-[#f7ede6] text-[#7b3b30]",
      className
    )}
    {...props}
  />
);
