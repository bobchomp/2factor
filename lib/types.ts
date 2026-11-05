export type Account = {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
  createdAt: number;
};

export type PublicAccount = Account;

export type StoredCredential = {
  id: string; // base64url credential ID
  publicKey: string; // base64url-encoded COSE public key
  counter: number;
  transports?: string[];
  label: string;
  createdAt: number;
};
