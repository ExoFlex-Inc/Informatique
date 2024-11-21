DO $$
DECLARE
    dev_id UUID := '5e7f65da-6877-4bec-87b8-8abe8e90587c';
    client_ids UUID[];
    user_id UUID;
BEGIN
    SELECT ARRAY_AGG(id) INTO client_ids FROM auth.users WHERE email LIKE 'user%@exoflex.com';

    FOREACH user_id IN ARRAY client_ids LOOP
        INSERT INTO relations (
            id,
            admin_id,
            client_id
        )
        VALUES (
            gen_random_uuid(),
            dev_id,
            user_id
        );
    END LOOP;
END $$;