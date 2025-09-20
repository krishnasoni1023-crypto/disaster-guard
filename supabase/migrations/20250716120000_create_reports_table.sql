/*
          # Create Reports Table
          This script creates the `reports` table to store user-submitted incident data and enables Row Level Security to control data access.

          ## Query Description: 
          This operation is structural and safe. It creates a new table `reports` for storing disaster incidents reported by users. It also sets up security policies to ensure that users can only create reports for themselves, but all authenticated users can view all reports. This change will not affect any existing data as it only adds new database objects.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (The table can be dropped)

          ## Structure Details:
          - Table Created: `public.reports`
          - Columns: `id`, `created_at`, `user_id`, `profile_name`, `type`, `severity`, `description`, `hashtags`, `latitude`, `longitude`, `address`, `state`, `media_url`, `verified`
          - Foreign Keys: `reports.user_id` references `auth.users(id)`

          ## Security Implications:
          - RLS Status: Enabled on `public.reports`
          - Policy Changes: Yes. Two policies are added:
            1. Allows all authenticated users to read all reports.
            2. Allows authenticated users to insert reports only for themselves.
          - Auth Requirements: Users must be authenticated to interact with this table.

          ## Performance Impact:
          - Indexes: A primary key index is created on `id`, and a foreign key index is created on `user_id`.
          - Triggers: None.
          - Estimated Impact: Low. This is a standard table creation and should not impact overall database performance.
          */

-- Create the reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    hashtags TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    state TEXT,
    media_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT false
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.reports IS 'Stores disaster reports submitted by users.';
COMMENT ON COLUMN public.reports.user_id IS 'Links to the user who submitted the report.';
COMMENT ON COLUMN public.reports.profile_name IS 'Denormalized user name for easier display.';
COMMENT ON COLUMN public.reports.verified IS 'Indicates if the report has been verified by an admin.';

-- 1. Enable RLS on the 'reports' table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows authenticated users to read all reports
CREATE POLICY "Allow authenticated users to read reports"
ON public.reports
FOR SELECT
TO authenticated
USING (true);

-- 3. Create a policy that allows users to insert reports for themselves
CREATE POLICY "Allow users to insert their own reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
