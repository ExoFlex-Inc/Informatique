import { createContext, useContext, ReactNode, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { UserProfile, SupabaseUserInfo } from "../hooks/use-session.ts";

const UserContext = createContext<SupabaseUserInfo | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    return (
        <UserContext.Provider value={{ session, profile, setSession, setProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useProfileContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useProfileContext must be used within an UserProvider");
    }
    return context;
};