import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
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

  const setupLocalServer = async (
    access_token: string,
    refresh_token: string,
  ) => {
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
  };

  useEffect(() => {
    supaClient.auth.getSession().then(({ data: { session } }) => {
      setUserInfo({ ...userInfo, session });
      supaClient.auth.onAuthStateChange((_event, session) => {
        setUserInfo({ session, profile: null });
        if (!session) {
          localStorage.removeItem("lastLocation");
          localStorage.removeItem("plan");
          navigate("/");
        }
      });
    });
  }, []);

  useEffect(() => {
    if (userInfo.session?.user && !userInfo.profile) {
      listenToUserProfileChanges(userInfo.session.user.id).then(
        (newChannel) => {
          if (newChannel) {
            if (channel) {
              channel.unsubscribe();
            }
            setChannel(newChannel);

            const access_token = userInfo.session?.access_token;
            const refresh_token = userInfo.session?.refresh_token;

            setupLocalServer(access_token, refresh_token);
          }
        },
      );
    } else if (!userInfo.session?.user) {
      channel?.unsubscribe();
      setChannel(null);
    }
  }, [userInfo.session]);

  async function listenToUserProfileChanges(userId: string) {
    const { data } = await supaClient
      .from("user_profiles")
      .select("*")
      .filter("user_id", "eq", userId);
    if (!data?.length) {
      navigate("/welcome");
    }
    setUserInfo({ ...userInfo, profile: data?.[0] });
    return supaClient
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
          setUserInfo({ ...userInfo, profile: payload.new as UserProfile });
        },
      )
      .subscribe();
  }

  return userInfo;
}
