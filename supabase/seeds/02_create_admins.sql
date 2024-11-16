DO $$
DECLARE
    i INTEGER;
    new_email TEXT;
    new_id UUID;
    new_phone_number TEXT;
    random_first_name TEXT;
    random_last_name TEXT;
    first_name_array TEXT[] := ARRAY['John', 'Jane', 'Alex', 'Emily', 'Michael', 'Sarah', 'David', 'Laura', 'James', 'Emma', 'Daniel', 'Olivia', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Jacob', 'Mia', 'Ethan', 'Ava'];
    last_name_array TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
BEGIN
    FOR i IN 1..10 LOOP
        new_email := 'admin' || i || '@exoflex.com';
        new_id := gen_random_uuid();
        new_phone_number := '(' || floor(random() * 900 + 100)::text || ')' ||
            floor(random() * 900 + 100)::text || '-' ||
            floor(random() * 10000)::text;

        random_first_name := first_name_array[floor(random() * array_length(first_name_array, 1)) + 1];
        random_last_name := last_name_array[floor(random() * array_length(last_name_array, 1)) + 1];

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
            new_id, 
            'authenticated', 
            'authenticated', 
            new_email, 
            crypt('exoflex', gen_salt('bf')),
            NOW(), 
            NOW(), 
            NOW(), 
            '{"provider":"email","providers":["email"]}', 
            json_build_object('first_name', random_first_name, 'last_name', random_last_name, 'speciality', 'Physiotherapist', 'permissions', 'admin'),
            NOW(),
            NOW(),
            '', 
            '', 
            '', 
            ''
        );

        INSERT INTO user_profiles (
            user_id, 
            first_name, 
            last_name, 
            speciality, 
            permissions,
            email,
            password,
            phone_number,
            created_at
        ) 
        VALUES (
            new_id,
            random_first_name,
            random_last_name, 
            'Physiotherapist', 
            'admin',
            new_email,
            crypt('exoflex', gen_salt('bf')),
            new_phone_number,
            NOW()
        );
    END LOOP;
END $$;