import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSupabaseSession() {
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    isFetching, // Fetching even after initial load (for refetches)
    isError,
    error,
    refetch, // Allow manual refetch of session
    failureCount, // Track how many times the query has failed
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:3001/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          const data = await response.json();
          console.warn("Session not valid, logging out:", data);
          return null;
        }

        if (!response.ok) {
          throw new Error("Error fetching session");
        }

        const data = await response.json();
        return data.session;
      } catch (error) {
        console.error("Error fetching session:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // Consider session fresh for 5 minutes
    cacheTime: 1000 * 60 * 10, // Cache session for 10 minutes
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
      try {
        const response = await fetch("http://localhost:3001/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ accessToken, refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Error setting session");
        }

        const data = await response.json();
        return data.session;
      } catch (error) {
        console.error("Error setting session:", error);
        return null;
      }
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(["session"], newSession);
    },
    onError: (error) => {
      console.error("Error setting session:", error.message);
      // Optionally, show a toast notification or some other UI feedback here
    },
    retry: 1, // Retry the mutation once if it fails
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
    refetch, // Allow manual refetching of session
    failureCount, // Track the number of failed fetch attempts
  };
}