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
        const data = await response.json();
        console.warn("Session not valid, logging out:", data);
        throw new Error("Unauthorized"); // Throw an error here
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching session: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.session;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
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
        throw new Error(`Error setting session: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.session;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(["session"], newSession);
    },
    onError: (error) => {
      console.error("Error setting session:", error.message);
      // Optionally, show a toast notification or some other UI feedback here
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