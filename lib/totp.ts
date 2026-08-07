import * as OTPAuth from "otpauth";
import type { Account } from "./types";

export type ParsedOtp = {
  issuer: string;
  label: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
};

// Validates and normalizes a base32 secret, throws if invalid.
export function normalizeSecret(secret: string): string {
  return OTPAuth.Secret.fromBase32(secret.replace(/\s+/g, "").toUpperCase())
    .base32;
}

export function parseOtpAuthUri(uri: string): ParsedOtp {
  const parsed = OTPAuth.URI.parse(uri);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error("Only time-based (TOTP) otpauth:// URIs are supported.");
  }
  return {
    issuer: parsed.issuer || "",
    label: parsed.label || "",
    secret: parsed.secret.base32,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
  };
}

export function generateCode(account: Account): {
  code: string;
  secondsRemaining: number;
} {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(account.secret),
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
  });
  const period = account.period || 30;
  return {
    code: totp.generate(),
    secondsRemaining: period - (Math.floor(Date.now() / 1000) % period),
  };
}
