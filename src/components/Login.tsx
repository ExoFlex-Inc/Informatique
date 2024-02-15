import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App.tsx";
import Dialog from "./Dialog.tsx";
import { supaClient } from "../hooks/supa-client.ts";
import { useTheme } from "@emotion/react";

export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<"sign_in" | "sign_up">("sign_in");
  const { session } = useContext(UserContext);
  const { palette } = useTheme();

  useEffect(() => {
    if (session?.user) {
      setShowModal(false);
    }
  }, [session]);

  const setReturnPath = () => {
    localStorage.setItem("returnPath", window.location.pathname);
  };

  return (
    <>
      <div className="flex m-4 place-items-center">
        <button
          className="login-button border-black border"
          onClick={() => {
            setShowModal(true);
            setAuthMode("sign_in");
            setReturnPath();
          }}
        >
          login
        </button>{" "}
        <span className={`p-2 ${palette.mode === "light" ? "text-black" : ""}`}>
          &nbsp;or
        </span>{" "}
        <button
          className="login-button border-black border"
          onClick={() => {
            setAuthMode("sign_up");
            setShowModal(true);
            setReturnPath();
          }}
        >
          sign up
        </button>
      </div>
      <Dialog
        open={showModal}
        dialogStateChange={(open) => setShowModal(open)}
        contents={
          <>
            <Auth
              supabaseClient={supaClient}
              appearance={{
                theme: ThemeSupa,
                className: {
                  container: "login-form-container",
                  label: "login-form-label",
                  button: "login-form-button",
                  input: "login-form-input",
                },
              }}
              view={authMode}
              providers={["google"]}
            />
            <button onClick={() => setShowModal(false)}>Close</button>
          </>
        }
      />
    </>
  );
}
