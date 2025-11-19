/*
  # Add role column to profiles

  Adds a role column to distinguish admins from regular users.
  Default role is 'user'. Valid roles: 'user', 'admin'.
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

UPDATE profiles
SET role = 'user'
WHERE role IS NULL;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'admin'));

