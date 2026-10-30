// Same email rule the book-appointment Edge Function applies server-side.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts Indian and international numbers: an optional leading +, then
// digits with optional spaces, dashes or brackets — 7 to 15 digits in total.
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
