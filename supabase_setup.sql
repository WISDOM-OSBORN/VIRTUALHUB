-- SUPABASE STORAGE SETUP
-- Run this in your Supabase SQL Editor

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies for 'projects' bucket
-- Allow public access to view projects
CREATE POLICY "Public Project Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'projects');

-- Allow authenticated users to upload to project bucket
CREATE POLICY "Authenticated Project Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'projects'
);

-- Allow users to update their own files in projects
CREATE POLICY "Owner Project Update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'projects' AND auth.uid() = owner
);

-- Allow users to delete their own files in projects
CREATE POLICY "Owner Project Delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'projects' AND auth.uid() = owner
);

-- 4. Storage Policies for 'avatars' bucket
-- Allow public access to view avatars
CREATE POLICY "Public Avatar Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated Avatar Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars'
);

-- Allow users to update their own avatars
CREATE POLICY "Owner Avatar Update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid() = owner
);

-- Allow users to delete their own avatars
CREATE POLICY "Owner Avatar Delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid() = owner
);
