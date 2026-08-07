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
