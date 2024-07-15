-- Insert a new user into auth.users and auth.identities tables
DO $$
DECLARE
    i INTEGER;
    j INTEGER;
    new_email TEXT;
    new_id UUID;
    exercise_id UUID;
    base_date TIMESTAMP;
    random_increment INTEGER;
    new_date TIMESTAMP;
    random_force_avg FLOAT;
    random_force_max FLOAT;
    random_angle_max FLOAT;
    random_angle_target FLOAT;
    random_repetitions_done INTEGER;
    random_repetitions_success_rate FLOAT;
    random_predicted_total_time FLOAT;
    random_actual_total_time FLOAT;
    random_rated_pain INT;
BEGIN
    FOR i IN 1..50 LOOP
        new_email := 'user' || i || '@example.com';
        new_id := gen_random_uuid();
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
            crypt('password123', gen_salt('bf')), 
            '2023-05-03 19:41:43.585805+00', 
            '2023-04-22 13:10:03.275387+00', 
            '2023-04-22 13:10:31.458239+00', 
            '{"provider":"email","providers":["email"]}', 
            '{}', 
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
            username, 
            lastname, 
            speciality, 
            permissions,
            email
        ) 
        VALUES (
            new_id, -- Ensuring the same UUID is used
            'User', 
            'Lastname', 
            'Client', 
            'client',
            new_email
        );

        FOR j IN 1..50 LOOP
            exercise_id := gen_random_uuid();

            new_date := base_date + INTERVAL '1 day';
            base_date:= new_date;

            random_force_avg := round((random() * 100)::numeric, 2);
            random_force_max := round((random() * 150)::numeric, 2);
            random_angle_max := round((random() * 90)::numeric, 2);
            random_angle_target := round((random() * 75)::numeric, 2);
            random_repetitions_done := floor(random() * 30) + 1;
            random_repetitions_success_rate := round((random() * 100)::numeric, 2);
            random_predicted_total_time := round((random() * 100)::numeric, 2);
            random_actual_total_time := round((random() * 120)::numeric, 2);
            random_rated_pain := floor(random() * 10) + 1;

            INSERT INTO exercise_data (
                id,
                user_id,
                date,
                force_avg,
                force_max,
                angle_max,
                angle_target,
                repetitions_done,
                repetitions_success_rate,
                predicted_total_time,
                actual_total_time,
                rated_pain
            )
            VALUES (
                exercise_id,
                new_id,
                new_date,
                random_force_avg,
                random_force_max,
                random_angle_max,
                random_angle_target,
                random_repetitions_done,
                random_repetitions_success_rate,
                random_predicted_total_time,
                random_actual_total_time,
                random_rated_pain
            );
        END LOOP;

    END LOOP;

    FOR i IN 1..10 LOOP
        new_email := 'admin' || i || '@example.com';
        new_id := gen_random_uuid();
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
            crypt('password123', gen_salt('bf')), 
            '2023-05-03 19:41:43.585805+00', 
            '2023-04-22 13:10:03.275387+00', 
            '2023-04-22 13:10:31.458239+00', 
            '{"provider":"email","providers":["email"]}', 
            '{}', 
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
            username, 
            lastname, 
            speciality, 
            permissions,
            email
        ) 
        VALUES (
            new_id, -- Ensuring the same UUID is used
            'Admin', 
            'Lastname', 
            'Physiotherapist', 
            'admin',
            new_email
        );

    END LOOP;

END $$;