import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client.ts";
import { useProfileContext } from "../context/profileContext.tsx";

export interface UserProfile {
  username: string;
  lastname: string;
  speciality: string;
  user_id: string;
  permissions: string;
  avatar_url?: string;
}

export interface SupabaseUserInfo {
  session: Session | null;
  profile: UserProfile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
}

export function useSession(): SupabaseUserInfo {
  const { session, profile, setSession, setProfile} = useProfileContext();

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  const setupLocalServer = useCallback(
    async (access_token: string, refresh_token: string) => {
      const requestBody = { access_token, refresh_token };

      try {
        const response = await fetch(
          "http://localhost:3001/api/setup-local-server",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          },
        );

        if (response.ok) {
          console.log("Local server setup successful");
        } else {
          console.error("Local server setup failed");
        }
      } catch (error) {
        console.error("Error during local server setup:", error);
      }
    },
    [],
  );

  useEffect(() => {
    const initializeSession = async () => {
      const {
        data: { session },
      } = await supaClient.auth.getSession();
      setSession(session)

      const {
        data: { subscription },
      } = supaClient.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setProfile(null);
        if (!newSession) {
          localStorage.removeItem("lastLocation");
          localStorage.removeItem("plan");
          navigate("/");
        }
      });

      return () => subscription.unsubscribe();
    };

    initializeSession();
  }, [navigate]);

  useEffect(() => {
    const handleUserProfile = async () => {
      if (session?.user && !profile) {
        const newChannel = await listenToUserProfileChanges(
          session.user.id,
        );
        if (newChannel) {
          if (channel) {
            channel.unsubscribe();
          }
          setChannel(newChannel);

          const access_token = session?.access_token || "";
          const refresh_token = session?.refresh_token || "";
          setupLocalServer(access_token, refresh_token);
        }
      } else if (!session?.user) {
        if (channel) {
          channel.unsubscribe();
        }
        setChannel(null);
      }
    };

    handleUserProfile();
  }, [session, profile, channel, setupLocalServer]);

  const listenToUserProfileChanges = useCallback(
    async (userId: string): Promise<RealtimeChannel | null> => {
      try {
        const { data, error } = await supaClient
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching user profile:", error);
          return null;
        }

        if (!data?.length) {
          navigate("/welcome");
          return null;
        }

        setProfile(data[0]);

        const newChannel = supaClient
          .channel(`public:user_profiles`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_profiles",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              setProfile(payload.new as UserProfile);
            },
          )
          .subscribe();

        return newChannel;
      } catch (error) {
        console.error("Error setting up profile change listener:", error);
        return null;
      }
    },
    [navigate],
  );

  return {session, profile, setSession, setProfile};
}
