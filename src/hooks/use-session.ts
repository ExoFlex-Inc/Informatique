import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client.ts";

export interface UserProfile {
  username: string;
  lastname: string;
  speciality: string;
  user_id: string;
  permissions: string;
  avatarUrl?: string;
}

export interface SupabaseUserInfo {
  session: Session | null;
  profile: UserProfile | null;
}

export function useSession(): SupabaseUserInfo {
  const [userInfo, setUserInfo] = useState<SupabaseUserInfo>({
    profile: null,
    session: null,
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  const setupLocalServer = useCallback(
    async (access_token: string, refresh_token: string) => {
      const requestBody = {
        access_token,
        refresh_token,
      };

      try {
        const responseServer = await fetch(
          "http://localhost:3001/setup-local-server",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (responseServer.ok) {
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
      setUserInfo((prevState) => ({ ...prevState, session }));

      const {
        data: { subscription },
      } = supaClient.auth.onAuthStateChange((_event, newSession) => {
        setUserInfo({ session: newSession, profile: null });
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
      if (userInfo.session?.user && !userInfo.profile) {
        const newChannel = await listenToUserProfileChanges(
          userInfo.session.user.id,
        );
        if (newChannel) {
          if (channel) {
            channel.unsubscribe();
          }
          setChannel(newChannel);

          const access_token = userInfo.session?.access_token || "";
          const refresh_token = userInfo.session?.refresh_token || "";

          setupLocalServer(access_token, refresh_token);
        }
      } else if (!userInfo.session?.user) {
        if (channel) {
          channel.unsubscribe();
        }
        setChannel(null);
      }
    };

    handleUserProfile();
  }, [userInfo.session, userInfo.profile, channel, setupLocalServer]);

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

        setUserInfo((prevState) => ({ ...prevState, profile: data[0] }));

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
              setUserInfo((prevState) => ({
                ...prevState,
                profile: payload.new as UserProfile,
              }));
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

  return userInfo;
}
