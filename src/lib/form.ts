/* Small, strict FormData readers shared by server actions. */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readText(fd: FormData, key: string, max: number): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s.length ? s : null;
}

/** Optional number within [min, max]. null = empty, undefined = invalid. */
export function readNumber(fd: FormData, key: string, min: number, max: number): number | null | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export function readEnum<T extends string>(fd: FormData, key: string, allowed: readonly T[]): T | undefined {
  const v = fd.get(key);
  return allowed.includes(v as T) ? (v as T) : undefined;
}
