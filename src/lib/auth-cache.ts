let cachedAuthUserId: string | null = null;

export function getCachedAuthUserId(): string | null {
  return cachedAuthUserId;
}

export function setCachedAuthUserId(id: string | null): void {
  cachedAuthUserId = id;
}
