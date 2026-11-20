let baseUrl = '';

/** En el servidor las consultas van directo a la API; en el navegador, al proxy /graphql. */
export function configurarApi(url: string) {
  baseUrl = url;
}

export class ErrorGraphQL extends Error {}

export async function pedir<T>(query: string, variables?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${baseUrl}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string }[] } | null;
  if (!res.ok || !json || json.errors?.length || !json.data) {
    throw new ErrorGraphQL(json?.errors?.[0]?.message ?? `La API respondió ${res.status}`);
  }
  return json.data;
}
