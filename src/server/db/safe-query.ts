export async function safeQuery<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  fallback: T,
): Promise<T> {
  const result = await promise;
  if (result.error) {
    console.error(result.error.message);
    return fallback;
  }

  return (result.data as T) ?? fallback;
}
