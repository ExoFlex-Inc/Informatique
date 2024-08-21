import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supaClient } from "./supa-client.ts";

export function useSupabaseSession() {
  const queryClient = useQueryClient();

  const { data: session, isLoading, error  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supaClient.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
        return null;
      }
      return data.session;
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const setSessionMutation = useMutation({
    mutationFn: async ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) => {
      const { data, error } = await supaClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.error("Error setting session:", error);
        return null;
      }
      return data.session;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(["session"], newSession);
    },
  });

  const setSession = (accessToken: string, refreshToken: string) => {
    setSessionMutation.mutate({ accessToken, refreshToken });
  };

  return { session, isLoading, setSession };
}