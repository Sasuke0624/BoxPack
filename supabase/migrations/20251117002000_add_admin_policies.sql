/*
  # Admin Policies for Materials and Options
  
  This migration adds Row Level Security policies that allow admins
  to perform CRUD operations on materials, material_thicknesses, and options.
*/

-- Admin policies for materials
CREATE POLICY "Admins can manage all materials"
  ON materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin policies for material_thicknesses
CREATE POLICY "Admins can manage all thicknesses"
  ON material_thicknesses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin policies for options
CREATE POLICY "Admins can manage all options"
  ON options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to read all materials (including inactive ones)
CREATE POLICY "Admins can read all materials"
  ON materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to read all thicknesses (including unavailable ones)
CREATE POLICY "Admins can read all thicknesses"
  ON material_thicknesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to read all options (including inactive ones)
CREATE POLICY "Admins can read all options"
  ON options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

