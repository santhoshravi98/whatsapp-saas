export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function createRequestId(prefix = "req") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
