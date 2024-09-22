import { useState } from "react";
import Dialog from "./Dialog.tsx";
import { useTheme } from "@emotion/react";
import { useSupabaseSession } from "../hooks/use-session.ts";
import { useUserProfile } from "../hooks/use-profile.ts";
import { getToken, deleteToken } from "firebase/messaging";
import { messaging } from "../utils/firebaseClient.ts";

export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<"sign_in" | "sign_up">("sign_in");
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const { setSession } = useSupabaseSession();
  const { setUserProfile } = useUserProfile();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
  
      setSession(data.session.access_token, data.session.refresh_token); //TODO Add Loading page while this and user profile loads
  
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      await deleteToken(messaging);

      // Request permission and get FCM token
      let fcmToken = '';
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (fcmToken) {
            console.log('FCM Token:', fcmToken);
          } else {
            console.warn('Failed to get FCM token');
          }
        } else {
          console.warn('Notification permission not granted');
        }
      } catch (fcmError) {
        console.error('Error fetching FCM token:', fcmError);
      }
  
      // Set user profile in your app state
      setUserProfile({
        user_id: data.user.id,
        first_name: data.user.user_metadata.first_name,
        last_name: data.user.user_metadata.last_name,
        speciality: data.user.user_metadata.speciality,
        permissions: data.user.user_metadata.permissions,
        fcm_token: fcmToken,
      });

      const updateProfileResponse = await fetch(`http://localhost:3001/user/${data.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          first_name: data.user.user_metadata.first_name,
          last_name: data.user.user_metadata.last_name,
          speciality: data.user.user_metadata.speciality,
          permissions: data.user.user_metadata.permissions,
        }),
      });
  
      const updatedProfile = await updateProfileResponse.json();
  
      if (!updateProfileResponse.ok) {
        throw new Error(updatedProfile.error || "Failed to update profile with FCM token");
      }

      setShowModal(false);
    } catch (error: any) {
      console.error("Login error:", error.message);
      alert(`Login failed: ${error.message}`);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    console.log("Attempting signup...");
    const response = await fetch("http://localhost:3001/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        speciality: speciality,
        permissions: "client",
      }),
    });
    console.log("Received response:", response);
    const data = await response.json();
    if (response.ok) {
      console.log("Signup successful:", data);
      setShowModal(false);
      alert(
        "Sign-up successful! Please check your email to verify your account.",
      );
    } else {
      console.error("Signup error:", data.error);
      alert("Signup failed: " + data.error);
    }
  }

  const renderForm = () => {
    return (
      <form
        onSubmit={authMode === "sign_in" ? handleLogin : handleSignUp}
        className="login-form-container"
      >
        <div>
          <label className="login-form-label" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="login-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="login-form-label" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="login-form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {authMode === "sign_up" && (
          <>
            <div>
              <label className="login-form-label" htmlFor="first_name">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                className="login-form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="login-form-label" htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                className="login-form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="login-form-label" htmlFor="speciality">
                Speciality
              </label>
              <input
                type="text"
                id="speciality"
                className="login-form-input"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                required
              />
            </div>
          </>
        )}
        <button type="submit" className="login-form-button">
          {authMode === "sign_in" ? "Login" : "Sign Up"}
        </button>
      </form>
    );
  };

  return (
    <>
      <div className="flex m-4 place-items-center">
        <button
          className="login-button border-black border"
          onClick={() => {
            setShowModal(true);
            setAuthMode("sign_in");
          }}
        >
          login
        </button>{" "}
        <span
          className={`p-2 ${palette?.mode === "light" ? "text-black" : ""}`}
        >
          &nbsp;or
        </span>{" "}
        <button
          className="login-button border-black border"
          onClick={() => {
            setAuthMode("sign_up");
            setShowModal(true);
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
            {renderForm()}
            <button onClick={() => setShowModal(false)}>Close</button>
          </>
        }
      />
    </>
  );
}
