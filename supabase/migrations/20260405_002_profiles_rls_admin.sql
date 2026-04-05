-- =============================================
-- Lentopallo Phase 2: Admin Profile Management RLS
-- Allows admins to read and update profiles in their club
-- Required for: assigning club_id and role to new users
-- Date: 2026-04-05
--
-- FIX: Uses SECURITY DEFINER helper functions to avoid
-- infinite recursion when profiles RLS policies query
-- the profiles table itself.
-- =============================================

-- Helper: get current user's club_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_club_id()
RETURNS uuid AS $$
  SELECT club_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin can read all profiles in their club
CREATE POLICY "admins_read_club_profiles"
ON profiles FOR SELECT TO authenticated
USING (
  public.is_admin() AND club_id = public.get_my_club_id()
);

-- Admin can update profiles in their club (assign role, club_id)
CREATE POLICY "admins_update_club_profiles"
ON profiles FOR UPDATE TO authenticated
USING (
  public.is_admin()
  AND (
    club_id = public.get_my_club_id()
    OR
    -- Allow admin to assign club_id to profiles that have NULL club_id
    -- This is needed for onboarding new users
    club_id IS NULL
  )
)
WITH CHECK (
  public.is_admin()
  AND club_id = public.get_my_club_id()
);
