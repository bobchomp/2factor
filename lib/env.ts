function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const getAppPin = () => requireEnv("APP_PIN");
export const getSessionSecret = () => requireEnv("SESSION_SECRET");
export const getEncryptionKey = () => requireEnv("ENCRYPTION_KEY");
