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
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    const url = queryKey.join("/") as string;
    console.log("[QueryClient] Fetching:", url);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log("[QueryClient] Response status:", res.status, res.statusText);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        const text = await res.text();
        console.error("[QueryClient] Error response:", text);
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      console.log("[QueryClient] Success:", url, "got", Array.isArray(data) ? `${data.length} items` : "1 item");
      return data;
    } catch (error: any) {
      console.error("[QueryClient] Fetch error for", url, ":", error);
      throw error;
    }
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
