import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSupabaseSession() {
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:3001/auth/session", {
          method: "GET",
          credentials: "include",
        });

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
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
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
  });

  const setSession = (accessToken: string, refreshToken: string) => {
    setSessionMutation.mutate({ accessToken, refreshToken });
  };

  return { session, isLoading, setSession, error };
}
