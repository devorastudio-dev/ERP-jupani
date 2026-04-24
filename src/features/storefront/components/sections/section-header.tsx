import clsx from "clsx";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export const SectionHeader = ({
  title,
  subtitle,
  className,
}: SectionHeaderProps) => (
  <div className={clsx("space-y-2", className)}>
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d59a73]">
      Ju.pani
    </p>
    <h2 className="font-display text-3xl text-[#3a231c] md:text-4xl">
      {title}
    </h2>
    {subtitle && <p className="text-sm text-[#7b3b30]">{subtitle}</p>}
  </div>
);
