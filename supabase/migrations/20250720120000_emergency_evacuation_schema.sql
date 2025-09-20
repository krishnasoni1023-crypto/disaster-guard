/*
# [Emergency Evacuation Schema]
This migration sets up the database tables required for the Emergency Evacuation feature. It creates tables for managing alerts, safe shelters, and user responses to those alerts.

## Query Description: [This operation creates three new tables: `alerts`, `shelters`, and `alert_responses`, along with two new ENUM types. It also enables Row Level Security on these tables and defines policies to control access. This is a structural change and does not affect existing data.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the tables and types)

## Structure Details:
- **Tables Created**:
  - `public.alerts`: Stores evacuation alerts pushed by authorities.
  - `public.shelters`: Stores information about safe shelters.
  - `public.alert_responses`: Stores user responses to evacuation alerts.
- **Enums Created**:
  - `public.alert_severity`: ('warning', 'urgent', 'critical')
  - `public.response_status`: ('safe', 'needs_help')
- **Relationships**:
  - `alert_responses` is linked to `alerts` and `auth.users`.

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Yes, new policies are created for `alerts`, `shelters`, and `alert_responses`.
- Auth Requirements: Users must be authenticated to respond to alerts. A hypothetical 'admin' role would be needed to create alerts and shelters (for now, this can be done via the Supabase dashboard or with `service_role`).

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed automatically.
- Triggers: None.
- Estimated Impact: Low. The new tables will only be queried within the Emergency Evacuation section of the app.
*/

-- 1. Create ENUM types
CREATE TYPE public.alert_severity AS ENUM ('warning', 'urgent', 'critical');
CREATE TYPE public.response_status AS ENUM ('safe', 'needs_help');

-- 2. Create `shelters` table
CREATE TABLE public.shelters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    address text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    capacity integer,
    current_occupancy integer NOT NULL DEFAULT 0,
    facilities text[],
    contact text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create `alerts` table
CREATE TABLE public.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    severity public.alert_severity NOT NULL,
    location_description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 4. Create `alert_responses` table
CREATE TABLE public.alert_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response public.response_status NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_alert_response UNIQUE (alert_id, user_id)
);

-- 5. Enable RLS for the new tables
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_responses ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Shelters: Anyone can view shelters.
CREATE POLICY "Allow public read access to shelters"
ON public.shelters
FOR SELECT
USING (true);

-- Alerts: Authenticated users can view alerts.
CREATE POLICY "Allow authenticated users to read alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (true);

-- Alert Responses: Users can insert their own response.
CREATE POLICY "Allow users to insert their own response"
ON public.alert_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Alert Responses: Users can view their own responses.
CREATE POLICY "Allow users to view their own responses"
ON public.alert_responses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: Policies for creating alerts and shelters are omitted.
-- This would typically be restricted to an 'admin' role.
-- For this prototype, admins can use the Supabase dashboard or service key.

-- 7. Add comments on new tables and columns for clarity
COMMENT ON TABLE public.shelters IS 'Stores information about safe shelters for evacuation.';
COMMENT ON TABLE public.alerts IS 'Stores evacuation alerts pushed by authorities.';
COMMENT ON TABLE public.alert_responses IS 'Tracks user responses to specific evacuation alerts.';
COMMENT ON COLUMN public.alert_responses.response IS 'The user''s status in response to an alert.';
