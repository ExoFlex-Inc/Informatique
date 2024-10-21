DO $$
DECLARE
    i INTEGER;
    j INTEGER;
    new_email TEXT;
    new_id UUID;
    base_date TIMESTAMPTZ;
    exercise_data JSONB;
    rated_pain INTEGER;
    repetitions_done INTEGER;
BEGIN

    SET LOCAL TIME ZONE 'America/Toronto';

    FOR i IN 1..50 LOOP
        new_email := 'user' || i || '@exoflex.com';
        new_id := gen_random_uuid();
        base_date := NOW() - INTERVAL '1 month'; 

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
            '2023-05-03 19:41:43.585805+00', 
            '2023-04-22 13:10:03.275387+00', 
            '2023-04-22 13:10:31.458239+00', 
            '{"provider":"email","providers":["email"]}', 
            json_build_object('first_name', 'User', 'last_name', 'Lastname', 'speciality', 'Client', 'permissions', 'client'), -- raw_user_meta_data to store profile info
            NOW(),
            NOW(),
            '', 
            '', 
            '', 
            ''
        );

        -- Insert into user_profiles
        INSERT INTO user_profiles (
            user_id, 
            first_name, 
            last_name, 
            speciality, 
            permissions,
            email,
            password,
            created_at
        ) 
        VALUES (
            new_id,
            'User', 
            'Lastname', 
            'Client', 
            'client',
            new_email,
            crypt('exoflex', gen_salt('bf')),
            NOW() AT TIME ZONE 'America/Toronto'
        );


        -- Insert a default plan for the user
        INSERT INTO plans (
            user_id,
            plan
        ) VALUES (
            new_id,
            '{
                "plan": [{
                    "rest": 30,
                    "speed": 1,
                    "repetitions": 10,
                    "time": 60,
                    "movement": [{
                        "exercise": "Dorsiflexion",
                        "target_angle": 30,
                        "target_torque": 50
                    }]
                }],
                "limits": {
                    "left": {
                        "torque": {
                            "dorsiflexion": 50,
                            "extension": 50,
                            "eversion": 50
                        },
                        "angles": {
                            "dorsiflexion": 30,
                            "extension": 30,
                            "eversion": 30
                        }
                    },
                    "right": {
                        "torque": {
                            "dorsiflexion": 50,
                            "extension": 50,
                            "eversion": 50
                        },
                        "angles": {
                            "dorsiflexion": 30,
                            "extension": 30,
                            "eversion": 30
                        }
                    }
                }
            }'
        );

        -- Loop for exercises
        FOR j IN 1..50 LOOP

            repetitions_done := round(random() * 10);
            -- Generate random exercise data
            exercise_data := jsonb_build_object(
                'recorded_date', to_char(base_date + (j * INTERVAL '1 day'), 'YYYY-MM-DD, HH24:MI:SS TZ'),
                'angles', jsonb_build_object(
                    'dorsiflexion', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ],
                    'extension', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ]
                ),
                'angle_max', jsonb_build_object(
                    'dorsiflexion', round((random()*90)::numeric, 2),
                    'eversion', round((random()*90)::numeric, 2),
                    'extension', round((random()*90)::numeric, 2)
                ),
                'torques', jsonb_build_object(
                    'dorsiflexion', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ],
                    'extension', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ]
                ),
                'torque_max', jsonb_build_object(
                    'dorsiflexion', round((random()*150)::numeric, 2),
                    'eversion', round((random()*150)::numeric, 2),
                    'extension', round((random()*150)::numeric, 2)
                ),
                'repetitions_done', repetitions_done,
                'repetitions_target', repetitions_done + round(random() * 10)
            );

            -- Random pain level
            rated_pain := floor(random() * 5) + 1;

            -- Insert exercise data into exercise_data table
            INSERT INTO exercise_data (
                user_id,
                data,
                rated_pain,
                created_at
            )
            VALUES (
                new_id,
                exercise_data,
                rated_pain,
                (base_date + (j * INTERVAL '1 day')) AT TIME ZONE 'UTC'
            );
        END LOOP;
    END LOOP;

    -- Admin user loop
    FOR i IN 1..10 LOOP
        new_email := 'admin' || i || '@exoflex.com';
        new_id := gen_random_uuid();

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
            '2023-05-03 19:41:43.585805+00', 
            '2023-04-22 13:10:03.275387+00', 
            '2023-04-22 13:10:31.458239+00', 
            '{"provider":"email","providers":["email"]}', 
            json_build_object('first_name', 'Admin', 'last_name', 'Lastname', 'speciality', 'Physiotherapist', 'permissions', 'admin'), -- raw_user_meta_data to store profile info
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
            created_at
        ) 
        VALUES (
            new_id,
            'Admin', 
            'Lastname', 
            'Physiotherapist', 
            'admin',
            new_email,
            crypt('exoflex', gen_salt('bf')),
            NOW() AT TIME ZONE 'America/Toronto'
        );

    END LOOP;

    -- Dev user
    new_email := 'dev@exoflex.com';
    new_id := '5e7f65da-6877-4bec-87b8-8abe8e90587c';
    base_date := NOW() - INTERVAL '1 month';

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
        '2023-05-03 19:41:43.585805+00', 
        '2023-04-22 13:10:03.275387+00', 
        '2023-04-22 13:10:31.458239+00', 
        '{"provider":"email","providers":["email"]}', 
        json_build_object('first_name', 'Dev', 'last_name', 'Lastname', 'speciality', 'Developer', 'permissions', 'dev'), -- raw_user_meta_data to store profile info
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
        NOW() AT TIME ZONE 'America/Toronto'
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

    -- Insert a default plan for the dev
    INSERT INTO plans (
        user_id,
        plan
    ) VALUES (
        new_id,
        '{
            "plan": [{
                "rest": 30,
                "speed": 1,
                "repetitions": 10,
                "time": 60,
                "movement": [{
                    "exercise": "Dorsiflexion",
                    "target_angle": 30,
                    "target_torque": 50
                }]
            }],
            "limits": {
                "left": {
                    "torque": {
                        "dorsiflexion": 50,
                        "extension": 50,
                        "eversion": 50
                    },
                    "angles": {
                        "dorsiflexion": 30,
                        "extension": 30,
                        "eversion": 30
                    }
                },
                "right": {
                    "torque": {
                        "dorsiflexion": 50,
                        "extension": 50,
                        "eversion": 50
                    },
                    "angles": {
                        "dorsiflexion": 30,
                        "extension": 30,
                        "eversion": 30
                    }
                }
            }
        }'
    );

    -- Exercises for dev user
        FOR j IN 1..50 LOOP

            repetitions_done := round(random() * 10);
            -- Generate random exercise data
            exercise_data := jsonb_build_object(
                'recorded_date', to_char(base_date + (j * INTERVAL '1 day'), 'YYYY-MM-DD, HH24:MI:SS TZ'),
                'angles', jsonb_build_object(
                    'dorsiflexion', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ],
                    'extension', ARRAY[
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2), 
                        round((random() * 90 * (CASE WHEN random() < 0.5 THEN -1 ELSE 1 END))::numeric, 2)
                    ]
                ),
                'angle_max', jsonb_build_object(
                    'dorsiflexion', round((random()*90)::numeric, 2),
                    'eversion', round((random()*90)::numeric, 2),
                    'extension', round((random()*90)::numeric, 2)
                ),
                'torques', jsonb_build_object(
                    'dorsiflexion', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ],
                    'extension', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ]
                ),
                'torque_max', jsonb_build_object(
                    'dorsiflexion', round((random()*150)::numeric, 2),
                    'eversion', round((random()*150)::numeric, 2),
                    'extension', round((random()*150)::numeric, 2)
                ),
                'repetitions_done', repetitions_done,
                'repetitions_target', repetitions_done + round(random() * 10)
            );

            -- Random pain level
            rated_pain := floor(random() * 5) + 1;

            -- Insert exercise data into exercise_data table
            INSERT INTO exercise_data (
                user_id,
                data,
                rated_pain,
                created_at
            )
            VALUES (
                new_id,
                exercise_data,
                rated_pain,
                (base_date + (j * INTERVAL '1 day')) AT TIME ZONE 'UTC'
            );
        END LOOP;

END $$;