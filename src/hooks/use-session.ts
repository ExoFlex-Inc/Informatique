import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { supaClient } from "./supa-client.ts";

export interface UserProfile {
  username: string;
  user_id: string;
  avatarUrl?: string;
}

export interface SupashipUserInfo {
  session: Session | null;
  profile: UserProfile | null;
}

export function useSession(): SupashipUserInfo {
  const [userInfo, setUserInfo] = useState<SupashipUserInfo>({
    profile: null,
    session: null,
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const navigate = useNavigate();

  const setupLocalServer = async (access_token: string, refresh_token: string) => {
    const requestBody = {
      access_token,
      refresh_token,
    };
  
    try {
      const responseServer = await fetch('http://localhost:3001/setup-local-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (responseServer.ok) {
        console.log('Local server setup successful');
      } else {
        console.error('Local server setup failed');
        setChannel(null);
        redirect("/");
      }
    } catch (error) {
      console.error('Error during local server setup:', error);
      setChannel(null); //TODO: When server local is not connected, it still signs in the user
      redirect("/");
    }
  };  

  useEffect(() => {
    supaClient.auth.getSession().then(({ data: { session } }) => {
      setUserInfo({ ...userInfo, session });
      supaClient.auth.onAuthStateChange((_event, session) => {
        setUserInfo({ session, profile: null });
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
          }
        },
        );
        
        
      const access_token = userInfo.session?.access_token;
      const refresh_token = userInfo.session?.refresh_token;

      setupLocalServer(access_token, refresh_token);

    } else if (!userInfo.session?.user) {
      channel?.unsubscribe();
      setChannel(null);
      redirect("/");
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
