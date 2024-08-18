import { useState } from "react";
import Dialog from "./Dialog.tsx";
import { useTheme } from "@emotion/react";
import { useProfileContext } from "../context/profileContext.tsx";

export default function Login() {
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<"sign_in" | "sign_up">("sign_in");
  const { setSession, setProfile } = useProfileContext();
  const { palette } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [speciality, setSpeciality] = useState('');

  async function handleLogin(event) {
    event.preventDefault();
    const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    const data = await response.json();
    if (response.ok) {
        console.log('Login successful:', data);
        setSession(data.supabaseUser.session);
        setProfile(data.supabaseUser.user.user_metadata);  
        setShowModal(false); 
    } else {
        console.error('Login error:', data.error);
        alert('Login failed: ' + data.error);
    }
}

async function handleSignUp(event) {
  event.preventDefault();
  console.log('Attempting signup...');
  const response = await fetch('http://localhost:3001/api/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      first_name: firstName,
      last_name: lastName,
      speciality: speciality,
      permissions: 'client',
    }),
  });
  console.log('Received response:', response);
  const data = await response.json();
  if (response.ok) {
    console.log('Signup successful:', data);
    setShowModal(false);
    alert('Sign-up successful! Please check your email to verify your account.');
  } else {
    console.error('Signup error:', data.error);
    alert('Signup failed: ' + data.error);
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
        <span className={`p-2 ${palette.mode === "light" ? "text-black" : ""}`}>
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