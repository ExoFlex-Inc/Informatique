import { useEffect, useState } from 'react';
import { useSupabaseSession } from '../hooks/use-session.ts';
import { useUserProfile } from '../hooks/use-profile.ts';
import { getToken } from 'firebase/messaging';
import { messaging } from '../utils/firebaseClient.ts';
import { useNavigate } from "react-router-dom";
import Dialog from '../components/Dialog.tsx';
import SignUp from '../components/Signup.tsx';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [password, setPassword] = useState('');
  const { isLoading:isSessionLoading,setSession } = useSupabaseSession();
  const { isLoading:isProfileLoading,setUserProfile } = useUserProfile();
  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSession(data.session.access_token, data.session.refresh_token);

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Request permission and get FCM token
      let fcmToken = '';
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (!fcmToken) {
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

      const updateProfileResponse = await fetch(
        `http://localhost:3001/user/${data.user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fcm_token: fcmToken,
            first_name: data.user.user_metadata.first_name,
            last_name: data.user.user_metadata.last_name,
            speciality: data.user.user_metadata.speciality,
            permissions: data.user.user_metadata.permissions,
          }),
        },
      );

      const updatedProfile = await updateProfileResponse.json();

      if (!updateProfileResponse.ok) {
        throw new Error(
          updatedProfile.error || 'Failed to update profile with FCM token',
        );
      }

      if (!isProfileLoading && !isSessionLoading) {
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error('Login error:', error.message);
      alert(`Login failed: ${error.message}`);
    }
  }
  
    return (
      <div className="relative flex h-screen gap-8">

        <div className="flex flex-col justify-center w-full max-w-md px-8 mx-auto lg:w-1/2">

        <div className="flex justify-center">
          <img
            src="/public/assets/logo.png"
            alt="Logo"
            className="object-contain"
            style={{ width: '300px', height: '300px' }}
          />
        </div>
    
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Icon code */}
              </button>
            </div>
            <button
              type="button"
              className="w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={(e) => handleLogin(e)}
            >
              Sign In
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-white">
            Don't have an account?{' '}
            <button
              className="font-medium text-blue-600 hover:text-blue-500"
              onClick={() => setShowSignUpModal(true)}
            >
              Sign up
            </button>
          </p>
          <Dialog
            open={showSignUpModal}
            dialogStateChange={(open) => setShowSignUpModal(open)}
            contents={
              <>
                <SignUp onClose={() => setShowSignUpModal(false)} />
              </>
            }
          />
        </div>
    
        <div className="w-full lg:w-1/2">
          <img
            className="object-cover w-full h-full"
            src="/public/assets/exoflex_team.jpg"
            alt="Team background"
          />
        </div>
      </div>
    );
  }