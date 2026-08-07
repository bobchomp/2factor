export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return trimmed.length >= 2
    ? trimmed[0].toUpperCase() + trimmed[1].toLowerCase()
    : trimmed[0].toUpperCase();
}
