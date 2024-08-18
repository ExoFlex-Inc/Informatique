import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client.ts";
import { useProfileContext } from "../context/profileContext.tsx";

export interface UserProfile {
  first_name: string;
  last_name: string;
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
  const { session, profile, setSession, setProfile } = useProfileContext();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supaClient.auth.onAuthStateChange(async (event) => {
      if (event == "PASSWORD_RECOVERY") {
        navigate("/recovery");
      }
    });
  }, []);

  useEffect(() => {
    const initializeSession = async () => {

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
        const newChannel = await listenToUserProfileChanges(session.user.id);
        if (newChannel) {
          if (channel) {
            channel.unsubscribe();
          }
          setChannel(newChannel);
        }
      } else if (!session?.user) {
        if (channel) {
          channel.unsubscribe();
        }
        setChannel(null);
      }
    };

    handleUserProfile();
  }, [session, profile, channel]);

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

  return { session, profile, setSession, setProfile };
}
