export default function formatDateToCustom(
  dateString: string | number | Date,
  withTime = true
) {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}
