import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSupabaseSession() {
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    failureCount,
    status,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3001/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        return Promise.reject({
          name: "UnauthorizedError",
          message: "Unauthorized",
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        return Promise.reject({
          name: "FetchError",
          message: `Error fetching session: ${response.status} ${errorText}`,
        });
      }

      const data = await response.json();
      return data.session;
    },
    retry: (failureCount, error) => {
      if (error.name === "UnauthorizedError") {
        return false;
      }
      return failureCount <= 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    staleTime: 1000 * 60 * 55, // 55 minutes
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const setSessionMutation = useMutation({
    mutationFn: async ({
      accessToken,
      refreshToken,
    }: {
      accessToken: string;
      refreshToken: string;
    }) => {
      const response = await fetch("http://localhost:3001/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error setting session: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      return data.session;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(["session"], newSession);
    },
    onError: (error) => {
      console.error("Error setting session:", error.message);
    },
    retry: 1,
  });

  const setSession = (accessToken: string, refreshToken: string) => {
    setSessionMutation.mutate({ accessToken, refreshToken });
  };

  return {
    session,
    isLoading,
    isFetching,
    isError,
    error,
    setSession,
    refetch,
    failureCount,
    status,
  };
}
