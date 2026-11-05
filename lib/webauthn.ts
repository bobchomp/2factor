import type { NextRequest } from "next/server";
import type { StoredCredential } from "./types";

export const RP_NAME = "2FA Authenticator";
export const REG_CHALLENGE_COOKIE = "tf_webauthn_reg_challenge";
export const LOGIN_CHALLENGE_COOKIE = "tf_webauthn_login_challenge";
export const CHALLENGE_COOKIE_MAX_AGE = 120; // seconds

export function getRpId(req: NextRequest): string {
  return req.nextUrl.hostname;
}

export function getOrigin(req: NextRequest): string {
  return req.nextUrl.origin;
}

export function labelFromUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android device";
  if (/Windows/.test(ua)) return "Windows PC";
  return "Device";
}

export type PublicCredential = {
  id: string;
  label: string;
  createdAt: number;
};

export function toPublicCredential(c: StoredCredential): PublicCredential {
  return { id: c.id, label: c.label, createdAt: c.createdAt };
}
