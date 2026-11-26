/**
 * Laravel's apiResource controllers sometimes return a plain array
 * (`Model::all()`) and sometimes a paginated resource collection
 * (`Model::paginate()`), which comes back as `{ data: [...], meta, links }`.
 * This normalizes either shape into a plain array so callers don't have
 * to care which one a given endpoint uses.
 */
export function unwrapList<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }

  return [];
}
