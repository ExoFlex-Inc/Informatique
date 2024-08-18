import { createContext, useContext, ReactNode, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { UserProfile } from "../hooks/use-session";
import { supaClient } from "../hooks/supa-client";

interface ProfileContextValue {
  session: Session | null;
  profile: UserProfile | null;
  setSession: (session: Session | null) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const setSession = async (session: Session | null) => {
    if (session) {
      const { error } = await supaClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) {
        console.error("Error setting session:", error);
        return;
      }
    }

    setSessionState(session);
  };

  return (
    <ProfileContext.Provider value={{ session, profile, setSession, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return context;
};