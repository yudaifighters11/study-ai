const PAGE_SIZE = 1000;

interface RangeResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * SupabaseはPostgRESTの既定仕様で1リクエストあたり最大1000件しか返さないため、
 * .range() を使ってページングしながら全件を取得する共通ヘルパー。
 */
export async function fetchAllRows<T>(
  buildQuery: (range: [number, number]) => PromiseLike<RangeResult<T>>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildQuery([from, from + PAGE_SIZE - 1]);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}
