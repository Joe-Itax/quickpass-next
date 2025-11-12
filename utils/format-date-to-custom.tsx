export default function formatDateToCustom(dateString: string | number | Date) {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
