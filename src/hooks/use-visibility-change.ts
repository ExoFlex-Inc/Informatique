import { useEffect, useRef } from "react";
import { supaClient } from "../hooks/supa-client.ts";
function useVisibilityChange() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Start auto-refresh when the app is visible
        supaClient.auth.startAutoRefresh();
      } else {
        // Stop auto-refresh when the app is hidden
        supaClient.auth.stopAutoRefresh();
      }
    };

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup the event listener on component unmount
    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

export default useVisibilityChange;