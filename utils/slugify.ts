export function slugify(t: string) {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading and trailing hyphens
    .replace(/(^-|-$)+/g, "");
}
