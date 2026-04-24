import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={clsx(
      "w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#3a231c] shadow-sm focus:border-[#d59a73] focus:outline-none",
      className
    )}
    {...props}
  />
);
