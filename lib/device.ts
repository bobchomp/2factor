// WebAuthn platform authenticators exist on desktop too (Touch ID, Windows
// Hello), but Face ID is specifically a phone/tablet feature - restrict the
// UI to mobile devices so it doesn't show up as a pointless option on a
// laptop.
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPod|iPad/i.test(ua)) return true;
  // Modern iPadOS reports a desktop Safari UA by default; touch support is
  // the reliable way to tell it apart from an actual Mac.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}
