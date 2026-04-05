-- =============================================
-- Lentopallo Phase 2: Admin Profile Management RLS
-- Allows admins to read and update profiles in their club
-- Required for: assigning club_id and role to new users
-- Date: 2026-04-05
-- =============================================

-- Admin can read all profiles in their club
CREATE POLICY "admins_read_club_profiles"
ON profiles FOR SELECT TO authenticated
USING (
  club_id IN (
    SELECT club_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin can update profiles in their club (assign role, club_id)
CREATE POLICY "admins_update_club_profiles"
ON profiles FOR UPDATE TO authenticated
USING (
  club_id IN (
    SELECT club_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
  OR
  -- Allow admin to assign club_id to profiles that have NULL club_id
  -- This is needed for onboarding new users
  (
    club_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
)
WITH CHECK (
  club_id IN (
    SELECT club_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
