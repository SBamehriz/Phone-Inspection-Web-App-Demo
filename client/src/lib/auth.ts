// client/src/lib/auth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

interface User {
  id: number;
  username: string;
  role: string;
}

interface SignInData {
  username: string;
  password: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    // 1) key for caching
    queryKey: ["/api/auth/user"],
    // 2) how to fetch
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/user");
      if (res.status === 401) {
        // not signed in → treat as “no user”
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      return res.json();
    },
    // 3) options
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SignInData) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/signout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    },
  });
}
