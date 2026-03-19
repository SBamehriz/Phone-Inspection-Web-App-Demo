import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: BodyInit | Record<string, unknown> | unknown,
  init?: RequestInit,
): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const isBodyInit =
    typeof Blob !== "undefined" && data instanceof Blob ||
    typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams ||
    typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer ||
    typeof ReadableStream !== "undefined" && data instanceof ReadableStream;

  const headers = new Headers(init?.headers || {});
  if (data !== undefined && !isFormData && !isBodyInit) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    method,
    headers,
    body:
      data === undefined
        ? undefined
        : isFormData || isBodyInit
          ? (data as BodyInit)
          : JSON.stringify(data),
    credentials: "include",
    ...init,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
