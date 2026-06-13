/* Command client for a Reachy AppServer (POST /api/cmd/{name}). */

export async function command<T = unknown>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`/api/cmd/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()) as T;
}
