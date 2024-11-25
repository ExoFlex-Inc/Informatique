DO $$
DECLARE
    i INTEGER;
    new_email TEXT;
    new_id UUID;
    user1_id UUID;
    new_phone_number TEXT;
    current_streak INTEGER;
    longest_streak INTEGER;
    random_first_name TEXT;
    random_last_name TEXT;
    first_name_array TEXT[] := ARRAY['John', 'Jane', 'Alex', 'Emily', 'Michael', 'Sarah', 'David', 'Laura', 'James', 'Emma', 'Daniel', 'Olivia', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Jacob', 'Mia', 'Ethan', 'Ava'];
    last_name_array TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
BEGIN
    SET LOCAL TIME ZONE 'America/Toronto';

    FOR i IN 1..20 LOOP
        new_email := 'user' || i || '@exoflex.com';
        new_id := gen_random_uuid();
        new_phone_number := '(' || floor(random() * 900 + 100)::text || ')' ||
                    floor(random() * 900 + 100)::text || '-' ||
                    floor(random() * 10000)::text;

        random_first_name := first_name_array[floor(random() * array_length(first_name_array, 1)) + 1];
        random_last_name := last_name_array[floor(random() * array_length(last_name_array, 1)) + 1];

        -- Insert into auth.users
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
            json_build_object('first_name', random_first_name, 'last_name', random_last_name, 'speciality', 'Client', 'permissions', 'client'),
            NOW(),
            NOW(),
            '', 
            '', 
            '', 
            ''
        );

        -- Save first user's ID
        IF i = 1 THEN
            user1_id := new_id;
        END IF;

        -- Insert into user_profiles
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
            'Client', 
            'client',
            new_email,
            crypt('exoflex', gen_salt('bf')),
            new_phone_number,
            NOW()
        );

        -- Insert a default plan for the user
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
                    }, {
                        "exercise": "Extension",
                        "target_angle": 30,
                        "target_torque": 18
                    }, {
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
        current_streak := floor(random() * 100) + 1;
        longest_streak := greatest(current_streak, floor(random() * 100) + 5);

        -- Insert into stats table
        INSERT INTO stats (user_id, current_streak, longest_streak)
        VALUES (new_id, current_streak, longest_streak);
    END LOOP;
END $$;