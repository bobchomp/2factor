// Soft throttle against rapid PIN guessing. This is a UX deterrent, not a
// hard security boundary - a client can clear the cookie to reset the
// counter. Choose a PIN with enough entropy (6+ digits) regardless.
export const ATTEMPTS_COOKIE = "tf_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export type AttemptState = { count: number; lockedUntil?: number };

export function parseAttempts(raw: string | undefined | null): AttemptState {
  if (!raw) return { count: 0 };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.count === "number") {
      return { count: parsed.count, lockedUntil: parsed.lockedUntil };
    }
  } catch {
    // ignore malformed cookie
  }
  return { count: 0 };
}

export function msUntilUnlocked(state: AttemptState): number {
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return state.lockedUntil - Date.now();
  }
  return 0;
}

export function recordFailure(state: AttemptState): AttemptState {
  const count = state.count + 1;
  if (count >= MAX_ATTEMPTS) {
    return { count: 0, lockedUntil: Date.now() + LOCKOUT_MS };
  }
  return { count };
}

export function serializeAttempts(state: AttemptState): string {
  return JSON.stringify(state);
}
