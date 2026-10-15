// Minimal Instagram Graph API client. The token goes in the Authorization header and never into
// logs, errors or tool results.

export class GraphError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number,
    public subcode?: number,
    public fbtraceId?: string,
  ) {
    super(message);
    this.name = "GraphError";
  }
  toJSON() {
    return { error: this.message, status: this.status, code: this.code, subcode: this.subcode, fbtrace_id: this.fbtraceId };
  }
}

export type GraphClient = {
  get<T = unknown>(path: string, params?: Record<string, string | number | undefined>): Promise<T>;
  post<T = unknown>(path: string, body?: Record<string, unknown>, params?: Record<string, string | number | undefined>): Promise<T>;
  del<T = unknown>(path: string): Promise<T>;
};

export function createGraphClient(opts: { apiBase: string; accessToken: string; fetchImpl?: typeof fetch; timeoutMs?: number }): GraphClient {
  const doFetch = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 15000;

  const url = (path: string, params?: Record<string, string | number | undefined>) => {
    const u = new URL(path.startsWith("http") ? path : `${opts.apiBase}/${path.replace(/^\/+/, "")}`);
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== "") u.searchParams.set(k, String(v));
    return u.toString();
  };

  async function call<T>(method: string, target: string, body?: Record<string, unknown>): Promise<T> {
    const res = await doFetch(target, {
      method,
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json: { error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string } } | undefined = undefined;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = undefined;
    }
    if (!res.ok || json?.error) {
      const e = json?.error ?? {};
      throw new GraphError(e.message || `Instagram API returned HTTP ${res.status}`, res.status, e.code, e.error_subcode, e.fbtrace_id);
    }
    return json as T;
  }

  return {
    get: (path, params) => call("GET", url(path, params)),
    post: (path, body, params) => call("POST", url(path, params), body ?? {}),
    del: (path) => call("DELETE", url(path)),
  };
}
