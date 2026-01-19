export function generateTerminalCode(name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-").slice(0, 10);
  // Utilisation de 36 pour une chaîne alphanumérique courte et unique
  const uniqueSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}_${uniqueSuffix}`;
}
