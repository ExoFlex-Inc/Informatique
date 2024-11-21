DO $$
DECLARE
    new_email TEXT := 'dev@exoflex.com';
    new_id UUID := '5e7f65da-6877-4bec-87b8-8abe8e90587c';
    new_phone_number TEXT;
    user1_id UUID;
BEGIN
    SELECT id INTO user1_id FROM auth.users WHERE email = 'user1@exoflex.com';

    new_phone_number := '(' || floor(random() * 900 + 100)::text || ')' ||
            floor(random() * 900 + 100)::text || '-' ||
            floor(random() * 10000)::text;

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
        json_build_object('first_name', 'Dev', 'last_name', 'Lastname', 'speciality', 'Developer', 'permissions', 'dev'),
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
        'Dev',
        'Lastname',
        'Developer',
        'dev',
        new_email,
        crypt('exoflex', gen_salt('bf')),
        new_phone_number,
        NOW()
    );

    INSERT INTO relations (
        id,
        admin_id,
        client_id
    )
    VALUES (
        gen_random_uuid(),
        new_id,
        new_id
    );

    INSERT INTO relations (
        id,
        admin_id,
        client_id
    )
    VALUES (
        gen_random_uuid(),
        new_id,
        user1_id
    );

    -- Insert a default plan for the dev
    INSERT INTO plans (
        user_id,
        plan
    ) VALUES (
        new_id,
        '{
            "plan": [{
                "rest": 3,
                "speed": 1,
                "repetitions": 3,
                "time": 3,
                "movement": [{
                    "exercise": "Eversion",
                    "target_angle": 0,
                    "target_torque": 8
                },
                {
                    "exercise": "Extension",
                    "target_angle": 45,
                    "target_torque": 18
                },
                {
                    "exercise": "Dorsiflexion",
                    "target_angle": 15,
                    "target_torque": 8
                }
                ]
            }],
            "limits": {
                "left": {
                    "torque": {
                        "dorsiflexion": 8,
                        "extension": 30,
                        "eversion": 8
                    },
                    "angles": {
                        "dorsiflexion": 30,
                        "extension": 10,
                        "eversion": 15
                    }
                },
                "right": {
                    "torque": {
                        "dorsiflexion": 8,
                        "extension": 30,
                        "eversion": 8
                    },
                    "angles": {
                        "dorsiflexion": 30,
                        "extension": 10,
                        "eversion": 15
                    }
                }
            }
        }'
    );

    -- Generate random values for current_streak and longest_streak
    DECLARE
        current_streak INTEGER := floor(random() * 100) + 1;
        longest_streak INTEGER := greatest(current_streak, floor(random() * 100) + 5); 
    BEGIN
        INSERT INTO stats (user_id, current_streak, longest_streak)
        VALUES (new_id, current_streak, longest_streak);
    END;
END $$;