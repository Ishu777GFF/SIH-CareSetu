export type PhoneAccessStatus = "ACTIVE" | "EXPIRED" | "USED" | "REVOKED";

export type PhoneAccessToken = {
  tokenId: string;
  patientId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  status: PhoneAccessStatus;
};

const STORAGE_KEY = "caresetu-demo-phone-access-v1";
const FIVE_MINUTES = 5 * 60 * 1000;

type TokenStore = Record<string, PhoneAccessToken>;

function readStore(): TokenStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as TokenStore;
  } catch {
    return {};
  }
}

function writeStore(tokens: TokenStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  window.dispatchEvent(new Event("caresetu-phone-access"));
}

function tokenId() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function createPhoneAccessToken(patientId: string): PhoneAccessToken {
  const now = new Date();
  const token: PhoneAccessToken = {
    tokenId: tokenId(),
    patientId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + FIVE_MINUTES).toISOString(),
    status: "ACTIVE",
  };
  const tokens = readStore();
  tokens[token.tokenId] = token;
  writeStore(tokens);
  return token;
}

export function getPhoneAccessToken(tokenId: string | null | undefined) {
  if (!tokenId) return undefined;
  const token = readStore()[tokenId];
  if (!token) return undefined;
  if (token.status === "ACTIVE" && Date.parse(token.expiresAt) <= Date.now()) {
    const tokens = readStore();
    const expired = { ...token, status: "EXPIRED" as const };
    tokens[token.tokenId] = expired;
    writeStore(tokens);
    return expired;
  }
  return token;
}

export function consumePhoneAccessToken(tokenId: string) {
  const token = getPhoneAccessToken(tokenId);
  if (!token || token.status !== "ACTIVE") return undefined;
  const used: PhoneAccessToken = {
    ...token,
    status: "USED",
    usedAt: new Date().toISOString(),
  };
  const tokens = readStore();
  tokens[tokenId] = used;
  writeStore(tokens);
  return used;
}

export function revokePhoneAccessToken(tokenId: string) {
  const token = getPhoneAccessToken(tokenId);
  if (!token || ["EXPIRED", "REVOKED"].includes(token.status)) return token;
  const revoked: PhoneAccessToken = { ...token, status: "REVOKED" };
  const tokens = readStore();
  tokens[tokenId] = revoked;
  writeStore(tokens);
  return revoked;
}

export function phoneAccessLink(tokenId: string) {
  if (typeof window === "undefined") return `/mobile-access?token=${encodeURIComponent(tokenId)}`;
  return `${window.location.origin}/mobile-access?token=${encodeURIComponent(tokenId)}`;
}

export function formatPhoneAccessCountdown(expiresAt: string, now = Date.now()) {
  const remaining = Math.max(0, Date.parse(expiresAt) - now);
  const minutes = Math.floor(remaining / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
