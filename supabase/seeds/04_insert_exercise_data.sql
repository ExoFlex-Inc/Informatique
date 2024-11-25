DO $$
DECLARE
    user_record RECORD;
    base_date TIMESTAMPTZ := NOW() - INTERVAL '1 month';
    j INTEGER;
    exercise_data JSONB;
    rated_pain INTEGER;
    repetitions_done INTEGER;
    dev_user_id UUID := '5e7f65da-6877-4bec-87b8-8abe8e90587c';
BEGIN
    -- Loop through users excluding the dev user
    FOR user_record IN SELECT id 
                       FROM auth.users 
                       WHERE role = 'authenticated' 
                         AND id != dev_user_id LOOP
        FOR j IN 1..50 LOOP
            repetitions_done := round(random() * 10);

            exercise_data := jsonb_build_object(
                'recorded_date', to_char((base_date + (j * INTERVAL '1 day')) AT TIME ZONE 'EST', 'YYYY-MM-DD, HH24:MI:SS "EST"'), -- TODO: Make it work for any timezone
                'angles', jsonb_build_object(
                    'dorsiflexion', ARRAY[
                        round((random() * 90 - 45)::numeric, 2), 
                        round((random() * 90 - 45)::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random() * 90 - 45)::numeric, 2), 
                        round((random() * 90 - 45)::numeric, 2)
                    ],
                    'extension', ARRAY[
                        round((random() * 90 - 45)::numeric, 2), 
                        round((random() * 90 - 45)::numeric, 2)
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
                        round((random()*150)::numeric, 2)
                    ],
                    'eversion', ARRAY[
                        round((random()*150)::numeric, 2), 
                        round((random()*150)::numeric, 2)
                    ],
                    'extension', ARRAY[
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

            rated_pain := floor(random() * 5) + 1;

            INSERT INTO exercise_data (
                user_id,
                data,
                rated_pain,
                created_at
            )
            VALUES (
                user_record.id,
                exercise_data,
                rated_pain,
                (base_date + (j * INTERVAL '1 day'))
            );
        END LOOP;
    END LOOP;
END $$;