import { createClient } from 'npm:@supabase/supabase-js@2'
import { JWT } from 'npm:google-auth-library@9'
import serviceAccount from '../service-account.json' with { type: 'json' }

interface Notification {
  id: string
  title: string
  type: string
  sender_id: string
  receiver_id: string
  user_name: string
  body: string
  image: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Notification
  schema: 'public'
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

  console.log(payload);

  // Fetch the fcm_token from the user_profiles table
  const { data, error } = await supabase
    .from('user_profiles')
    .select('fcm_token')
    .eq('user_id', payload.record.receiver_id)
    .single();

  // Check if the fcm_token exists
  if (error || !data?.fcm_token) {
    console.warn(`No valid FCM token found for user: ${payload.record.receiver_id}`);
    return new Response(JSON.stringify({
      message: "FCM token not found. Push notification canceled.",
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const fcmToken = data.fcm_token as string;

  console.log('Sending notification to', fcmToken);

  // Get the access token for Firebase messaging
  const accessToken = await getAccessToken({
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  });

  // Send the notification to Firebase Cloud Messaging (FCM)
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title: "ExoFlex",
            body: payload.record.body,
            image: payload.record.image,
          },
          data: {
            id: payload.record.id,
            user_name: payload.record.user_name,
            type: payload.record.type,
            sender_id: payload.record.sender_id,
          }
        },
      }),
    }
  );

  const resData = await res.json();

  if (res.status < 200 || res.status > 299) {
    console.error('Error sending notification:', resData);
    throw resData;
  }

  // Return the response from FCM
  return new Response(JSON.stringify(resData), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Function to get access token for Firebase
const getAccessToken = ({
  clientEmail,
  privateKey,
}: {
  clientEmail: string;
  privateKey: string;
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens!.access_token!);
    });
  });
};