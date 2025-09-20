/*
# [Initial Schema: Profiles and Auth Trigger]
This migration sets up the initial database schema required for user management in the DisasterGuard application. It includes the creation of a `profiles` table to store user-specific data and a trigger to automatically populate this table upon new user registration.

## Query Description:
This script performs the following actions:
1.  **Creates the `public.profiles` table:** This table will store additional user information not present in the `auth.users` table, such as full name, mobile number, and address. The `id` column is a foreign key to `auth.users.id`, linking user authentication data with their profile.
2.  **Enables Row Level Security (RLS) on `profiles`:** This is a critical security measure to ensure that users can only access and modify their own data.
3.  **Creates RLS Policies:**
    - `SELECT`: Allows users to read only their own profile.
    - `INSERT`: Allows users to create their own profile record.
    - `UPDATE`: Allows users to update their own profile.
    This prevents data leakage and unauthorized access between users.
4.  **Creates a `handle_new_user` function:** This PostgreSQL function is designed to be triggered after a new user is created in `auth.users`. It extracts metadata (like name and address) provided during sign-up and inserts it into the `public.profiles` table.
5.  **Creates a Trigger `on_auth_user_created`:** This trigger is attached to the `auth.users` table and executes the `handle_new_user` function after every new user insertion, automating profile creation.

There is no data loss risk as this is an additive change creating new tables and functions.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Tables Created:** `public.profiles`
- **Functions Created:** `public.handle_new_user()`
- **Triggers Created:** `on_auth_user_created` on `auth.users`
- **RLS Policies Created:** SELECT, INSERT, UPDATE policies on `public.profiles`

## Security Implications:
- RLS Status: Enabled on `public.profiles`.
- Policy Changes: Yes, new policies are created to enforce data isolation for users.
- Auth Requirements: These changes are tightly coupled with Supabase Auth. The policies rely on `auth.uid()` to identify the current user.

## Performance Impact:
- Indexes: A primary key index is automatically created on `profiles.id`.
- Triggers: An `AFTER INSERT` trigger is added to `auth.users`. This introduces a small, negligible overhead on new user sign-ups.
- Estimated Impact: Low. The impact is limited to the user registration process and is highly optimized.
*/

-- 1. Create public.profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL,
  full_name TEXT,
  mobile_number TEXT,
  aadhaar_number TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Allow users to view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile_number, aadhaar_number, address)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'mobile',
    new.raw_user_meta_data->>'aadhaar',
    new.raw_user_meta_data->>'address'
  );
  RETURN new;
END;
$$;

-- 5. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
