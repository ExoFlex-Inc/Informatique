-- Create extension if not already installed
CREATE EXTENSION IF NOT EXISTS ltree;

/*
.#########.##....##.##.....##.##..........##
.##........###...##.##.....##.###........###
.##........####..##.##.....##.####......####
.########..##.##.##.##.....##.##.##....##.##
.##........##..####.##.....##.##..##..##..##
.##........##...###.##.....##.##...####...##
.########..##....##..#######..##....## ...##
*/

CREATE TYPE permissions_enum AS ENUM ('dev', 'admin', 'client');
CREATE TYPE client_admin_status AS ENUM ('pending', 'accepted');

/*
.########....###....########..##.......########..######.
....##......##.##...##.....##.##.......##.......##....##
....##.....##...##..##.....##.##.......##.......##......
....##....##.....##.########..##.......######....######.
....##....#########.##.....##.##.......##.............##
....##....##.....##.##.....##.##.......##.......##....##
....##....##.....##.########..########.########..######.
*/

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) NOT NULL,
  first_name TEXT CHECK (char_length(first_name) > 0 AND char_length(first_name) <= 50 AND first_name !~ '\d'), 
  last_name TEXT CHECK (char_length(last_name) > 0 AND char_length(last_name) <= 50 AND last_name !~ '\d'),
  permissions permissions_enum NOT NULL,
  speciality TEXT CHECK (char_length(speciality) > 0 AND char_length(speciality) <= 50 AND speciality !~ '\d'),
  phone_number TEXT CHECK (char_length(phone_number) > 0 AND char_length(phone_number) <= 50 AND phone_number ~ '\d'),
  email TEXT CHECK (char_length(email) > 0 AND char_length(email) <= 50),
  fcm_token TEXT,
  avatar_url TEXT,
  password TEXT CHECK (char_length(password) > 0)
);

CREATE TABLE relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid references auth.users(id) not null,
  plan JSONB,
  created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE encoder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid references auth.users(id) not null,
  angle_data JSONB,
  created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE exercise_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid REFERENCES user_profiles(user_id),
  date timestamptz NOT NULL,
  force_avg float,
  force_max float,
  angle_max float,
  angle_target float,
  repetitions_done int,
  repetitions_success_rate float,
  predicted_total_time float,
  actual_total_time float,
  rated_pain int

);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  user_name TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  body TEXT NOT NULL
);

create trigger "notifications" after insert
on "public"."notifications" for each row
execute function "supabase_functions"."http_request"(
  'http://host.docker.internal:54326/functions/v1/push',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);


/*
.########.##.....##.##....##..######..########.####..#######..##....##..######.
.##.......##.....##.###...##.##....##....##.....##..##.....##.###...##.##....##
.##.......##.....##.####..##.##..........##.....##..##.....##.####..##.##......
.######...##.....##.##.##.##.##..........##.....##..##.....##.##.##.##..######.
.##.......##.....##.##..####.##..........##.....##..##.....##.##..####.......##
.##.......##.....##.##...###.##....##....##.....##..##.....##.##...###.##....##
.##........#######..##....##..######.....##....####..#######..##....##..######.
*/

CREATE FUNCTION push_angle(machine_id uuid, user_id uuid, angles jsonb, created_at date)
RETURNS void AS $$
BEGIN
  INSERT INTO encoder(machine_id, user_id, angle_data, created_at)
  VALUES (machine_id, user_id, angles, created_at);
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION get_angle(search_id uuid, start_date date, end_date date)
RETURNS TABLE (created_at date, angle_data jsonb) AS $$
BEGIN
    RETURN QUERY
    SELECT e.created_at, e.angle_data
    FROM encoder e
    WHERE e.user_id = search_id
    AND e.created_at >= start_date
    AND e.created_at <= end_date
    ORDER BY e.created_at ASC;
END;
$$ LANGUAGE plpgsql;

/*
..######..########..#######..########.....###.....#######..########
.##....##....##....##.....##.##.....##...##.##...##.....##.##......
.##..........##....##.....##.##.....##..##...##..##........##......
..######.....##....##.....##.########..##.....##.##........######..
.......##....##....##.....##.##...##...#########.##..#####.##......
.##....##....##....##.....##.##....##..##.....##.##.....##.##......
..######.....##.....#######..##.....##.##.....##..#######..########
*/

INSERT INTO storage.buckets(id, name, public, file_size_limit) VALUES ('avatars', 'avatars', true, 52428800);

/*
.########...#######..##.......####..######..####.########..######.
.##.....##.##.....##.##........##..##....##..##..##.......##....##
.##.....##.##.....##.##........##..##........##..##.......##......
.########..##.....##.##........##..##........##..######....######.
.##........##.....##.##........##..##........##..##.............##
.##........##.....##.##........##..##....##..##..##.......##....##
.##.........#######..########.####..######..####.########..######.
*/


-- TODO: Review all policies and add the necessary checks
alter table user_profiles enable row level security;
alter table encoder enable row level security;
alter table plans enable row level security;
alter table exercise_data enable row level security;
alter table relations enable row level security;

CREATE POLICY "avatars policy all can see" ON "storage"."objects"
AS permissive FOR SELECT
TO public
USING ((bucket_id = 'avatars'::text));

CREATE POLICY "avatars policy can update" ON "storage"."objects"
AS permissive FOR UPDATE 
TO public
USING ((bucket_id = 'avatars'::text));

CREATE POLICY "avatars policy users can delete" ON "storage"."objects"
AS permissive FOR DELETE 
TO public
USING ((bucket_id = 'avatars'::text));

CREATE POLICY "avatars policy users can insert" ON "storage"."objects"
AS permissive FOR INSERT
TO public
WITH CHECK ((bucket_id = 'avatars'::text));

CREATE POLICY "all can see" ON "public"."relations"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert" ON "public"."relations"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "owners can update" ON "public"."relations"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "owners can delete" ON "public"."relations"
AS PERMISSIVE FOR DELETE
TO public
USING (true);

CREATE POLICY "all can see" ON "public"."user_profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert" ON "public"."user_profiles"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "owners can update" ON "public"."user_profiles"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid()=user_id)
WITH CHECK (auth.uid()=user_id);

CREATE POLICY "all can see" ON "public"."exercise_data"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert exercise data" ON "public"."exercise_data"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "owners can update exercise data" ON "public"."exercise_data"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "all can see" ON "public"."encoder"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert encoder" ON "public"."encoder"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "all can see plans" ON "public"."plans"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert plans" ON "public"."plans"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "admins_and_managers_can_assign_admin" ON public.user_profiles
AS PERMISSIVE FOR UPDATE
TO public
USING (
    (
        SELECT permissions
        FROM public.user_profiles
        WHERE user_id = auth.uid()
    ) IN ('dev', 'admin') AND permissions = 'client'
)
WITH CHECK (
    (
        SELECT permissions
        FROM public.user_profiles
        WHERE user_id = auth.uid()
    ) IN ('dev', 'admin') AND permissions = 'client'
);

CREATE POLICY "Allow logged-in users to insert their own exercise data" ON exercise_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow logged-in users to select their own exercise data" ON exercise_data
  FOR SELECT
  USING (auth.uid() = user_id);