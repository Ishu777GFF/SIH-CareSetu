import type { Report } from "./medi-data";

export type ContinuityPassport = {
  code: string;
  patientId: string;
  answers: Record<string, string>;
  intakeStep: number;
  reports: Report[];
  createdAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "USED" | "REVOKED";
};

const KEY = "caresetu-continuity-passports-v1";
const LIFETIME = 15 * 60 * 1000;
type Store = Record<string, ContinuityPassport>;

const read = (): Store => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Store; } catch { return {}; }
};
const write = (store: Store) => {
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("caresetu-continuity-passport"));
};
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4))).map(x => x.toString(36).padStart(2, "0")).join("").slice(0, 8).toUpperCase();

export function createContinuityPassport(input: Omit<ContinuityPassport, "code" | "createdAt" | "expiresAt" | "status">) {
  const now = new Date();
  const passport: ContinuityPassport = { ...input, code: newCode(), createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + LIFETIME).toISOString(), status: "ACTIVE" };
  const store = read(); store[passport.code] = passport; write(store); return passport;
}
export function getContinuityPassport(code: string | null | undefined) {
  if (!code) return undefined;
  const passport = read()[code.trim().toUpperCase()];
  if (!passport) return undefined;
  if (passport.status === "ACTIVE" && Date.parse(passport.expiresAt) <= Date.now()) {
    const store = read(); const expired = { ...passport, status: "EXPIRED" as const }; store[expired.code] = expired; write(store); return expired;
  }
  return passport;
}
export function consumeContinuityPassport(code: string) {
  const passport = getContinuityPassport(code);
  if (!passport || passport.status !== "ACTIVE") return undefined;
  const used = { ...passport, status: "USED" as const };
  const store = read(); store[used.code] = used; write(store); return used;
}
export const continuityPassportLink = (code: string) => `${window.location.origin}/resume-case?code=${encodeURIComponent(code)}`;
