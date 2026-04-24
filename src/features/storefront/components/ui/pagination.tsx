import Link from "next/link";
import clsx from "clsx";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | number | boolean | undefined>;
};

const buildQuery = (query: PaginationProps["query"], page: number) => {
  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === false) {
        return;
      }
      params.set(key, String(value));
    });
  }
  params.set("page", String(page));
  return `${params.toString()}`;
};

export const Pagination = ({ page, totalPages, basePath, query }: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
      {pages.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={`${basePath}?${buildQuery(query, pageNumber)}`}
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            pageNumber === page
              ? "bg-[#3a231c] text-white"
              : "border border-[#f1d0c7] bg-white text-[#7b3b30] hover:-translate-y-0.5 hover:bg-[#fdf3ee]"
          )}
        >
          {pageNumber}
        </Link>
      ))}
    </div>
  );
};
