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
  speciality TEXT CHECK (char_length(speciality) > 0 AND char_length(speciality) <= 50 AND speciality !~ '\d')
);

CREATE TABLE machine (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4() not null,
  user_id uuid references auth.users(id) not null
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid references auth.users(id) not null,
  plan JSONB,
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

CREATE OR REPLACE FUNCTION push_planning(user_id UUID, plan JSONB)
RETURNS VOID AS $$
BEGIN
  -- Debug statement to check input parameters
  RAISE NOTICE 'user_id: %, plan: %', user_id, plan;
  
  IF EXISTS (SELECT 1 FROM plans WHERE plans.user_id = push_planning.user_id) THEN
    -- Debug statement to check if entering the IF block
    RAISE NOTICE 'Updating plan for user_id: %', user_id;
    
    UPDATE plans
    SET plan = jsonb_set(plans.plan, '{}', push_planning.plan)
    WHERE plans.user_id = push_planning.user_id;
  ELSE
    -- Debug statement to check if entering the ELSE block
    RAISE NOTICE 'Inserting plan for user_id: %', user_id;
    
    INSERT INTO plans(user_id, plan)
    VALUES (push_planning.user_id, push_planning.plan);
  END IF;
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

CREATE POLICY "all can see" ON "public"."plans"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "users can insert encoder" ON "public"."plans"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);
