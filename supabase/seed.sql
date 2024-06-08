-- Insert a new user into auth.users and auth.identities tables
INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    recovery_sent_at, 
    last_sign_in_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    'admin@example.com', 
    crypt('password123', gen_salt('bf')), 
    '2023-05-03 19:41:43.585805+00', 
    '2023-04-22 13:10:03.275387+00', 
    '2023-04-22 13:10:31.458239+00', 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    '2023-05-03 19:41:43.580424+00', 
    '2023-05-03 19:41:43.585948+00',
    '', 
    '', 
    '', 
    ''
);

-- Insert into user_profiles
INSERT INTO user_profiles (
    user_id, 
    username, 
    lastname, 
    speciality, 
    permissions 
) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@example.com'), -- Ensuring the same UUID is used
    'Olivier', 
    'Jackson', 
    'Engineer', 
    'admin'
);
