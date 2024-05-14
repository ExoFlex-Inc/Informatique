-- Create extension if not already installed
CREATE EXTENSION IF NOT EXISTS ltree;

/*
.########....###....########..##.......########..######.
....##......##.##...##.....##.##.......##.......##....##
....##.....##...##..##.....##.##.......##.......##......
....##....##.....##.########..##.......######....######.
....##....#########.##.....##.##.......##.............##
....##....##.....##.##.....##.##.......##.......##....##
....##....##.....##.########..########.########..######.
*/

CREATE TABLE  user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) NOT NULL,
  username TEXT CHECK (char_length(username) > 0 AND char_length(username) <= 50 AND username !~ '\d'), 
  lastname TEXT CHECK (char_length(lastname) > 0 AND char_length(lastname) <= 50 AND lastname !~ '\d'),
  speciality TEXT CHECK (char_length(speciality) > 0 AND char_length(speciality) <= 50 AND speciality !~ '\d'),
  phone_number TEXT CHECK (char_length(phone_number) > 0 AND char_length(phone_number) <= 50 AND phone_number ~ '\d'),
  list_of_patient JSONB,
  email TEXT CHECK (char_length(email) > 0 AND char_length(email) <= 50)
);

CREATE TABLE machine (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4() not null,
  user_id uuid references auth.users(id) not null
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid references auth.users(id) not null,
  plan_content JSONB,
  created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE encoder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  machine_id UUID REFERENCES machine(id),
  user_id uuid references auth.users(id) not null,
  angle_data JSONB,
  created_at DATE DEFAULT CURRENT_DATE
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
CREATE OR REPLACE FUNCTION get_or_create_machine_for_user(search_id uuid)
RETURNS uuid 
LANGUAGE plpgsql 
AS $$
DECLARE
  machine_id uuid;
BEGIN

  SELECT id INTO machine_id FROM machine WHERE user_id = search_id;

  IF machine_id IS NOT NULL THEN
    -- If the user_id already exists, return the existing user's machine ID
    RETURN machine_id;
  ELSE
    -- If the user_id doesn't exist, create a new record and associate it with the user
    INSERT INTO machine (id, user_id)
    VALUES (DEFAULT, search_id)
    RETURNING id INTO machine_id;
    RETURN machine_id;
  END IF;
END;
$$;


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

CREATE OR REPLACE FUNCTION push_planning(user_id UUID, new_plan JSONB)
RETURNS JSONB AS $$
DECLARE
  updated_plan JSONB;
BEGIN
  IF EXISTS (SELECT 1 FROM plans WHERE plans.user_id = push_planning.user_id) THEN
    UPDATE plans
    SET plan_content = new_plan
    WHERE plans.user_id = push_planning.user_id
    RETURNING new_plan INTO updated_plan;
  ELSE
    INSERT INTO plans(user_id, plan_content)
    VALUES (push_planning.user_id, new_plan)
    RETURNING new_plan INTO updated_plan;
  END IF;

  RETURN updated_plan;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION push_users_list(user_id UUID, new_list JSONB)
RETURNS JSONB AS $$
DECLARE
  updated_list JSONB;
BEGIN
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = push_users_list.user_id) THEN
    UPDATE user_profiles
    SET list_of_patient = new_list
    WHERE user_profiles.user_id = push_users_list.user_id
    RETURNING new_list INTO updated_list;
  ELSE
    INSERT INTO user_profiles(user_id, list_of_patient)
    VALUES (push_users_list.user_id, new_list)
    RETURNING new_list INTO updated_list;
  END IF;

  RETURN updated_list;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_planning(search_id UUID)
RETURNS TABLE (plan_content jsonb) AS $$
BEGIN
    RAISE LOG 'Searching for plan content with user_id:%', search_id;
    
    RETURN QUERY
    SELECT p.plan_content
    FROM plans p
    WHERE p.user_id = search_id;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_users_list(search_id UUID)
RETURNS TABLE (list_of_patient jsonb) AS $$
BEGIN
    RAISE LOG 'Searching for list content with user_id:%', search_id;

    RETURN QUERY
    SELECT u.list_of_patient
    FROM user_profiles u
    WHERE u.user_id = search_id;
END;
$$ LANGUAGE plpgsql;

/*
.########...#######..##.......####..######..####.########..######.
.##.....##.##.....##.##........##..##....##..##..##.......##....##
.##.....##.##.....##.##........##..##........##..##.......##......
.########..##.....##.##........##..##........##..######....######.
.##........##.....##.##........##..##........##..##.............##
.##........##.....##.##........##..##....##..##..##.......##....##
.##.........#######..########.####..######..####.########..######.
*/

alter table user_profiles enable row level security;
alter table machine enable row level security;
alter table encoder enable row level security;
alter table plans enable row level security;

CREATE POLICY "all can see" ON "public"."user_profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert" ON "public"."user_profiles"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners can update" ON "public"."user_profiles"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid()=user_id)
WITH CHECK (auth.uid()=user_id);

CREATE POLICY "all can see" ON "public"."machine"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert machine" ON "public"."machine"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

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
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "owners can update plans" ON "public"."plans"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

