export type DateRangeInput = {
  start?: string;
  end?: string;
  reset?: string;
};

export function resolveDateRange(input?: DateRangeInput) {
  if (!input || input.reset === "1") {
    return { start: "", end: "" };
  }

  const start = input.start && /^\d{4}-\d{2}-\d{2}$/.test(input.start) ? input.start : "";
  const end = input.end && /^\d{4}-\d{2}-\d{2}$/.test(input.end) ? input.end : "";

  return { start, end };
}
