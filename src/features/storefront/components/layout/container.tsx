import clsx from "clsx";
import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export const Container = ({ children, className }: ContainerProps) => (
  <div className={clsx("mx-auto w-full max-w-6xl px-6 lg:px-10", className)}>
    {children}
  </div>
);
