-- SUPABASE STORAGE & VECTOR SETUP
-- Run this in your Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table schema enhancements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_profile JSONB;
-- Recreate embedding column for new dimensions (drops existing 768-dim data)
ALTER TABLE profiles DROP COLUMN IF EXISTS embedding;
ALTER TABLE profiles ADD COLUMN embedding vector(768);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS semantic_summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url_2 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url_3 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url_4 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Projects table schema enhancements
ALTER TABLE projects DROP COLUMN IF EXISTS embedding;
ALTER TABLE projects ADD COLUMN embedding vector(768);

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
DROP POLICY IF EXISTS "Public Project Access" ON storage.objects;
CREATE POLICY "Public Project Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'projects');

DROP POLICY IF EXISTS "Authenticated Project Upload" ON storage.objects;
CREATE POLICY "Authenticated Project Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'projects'
);

DROP POLICY IF EXISTS "Owner Project Update" ON storage.objects;
CREATE POLICY "Owner Project Update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'projects' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Owner Project Delete" ON storage.objects;
CREATE POLICY "Owner Project Delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'projects' AND auth.uid() = owner
);

-- 4. Storage Policies for 'avatars' bucket
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;
CREATE POLICY "Authenticated Avatar Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars'
);

DROP POLICY IF EXISTS "Owner Avatar Update" ON storage.objects;
CREATE POLICY "Owner Avatar Update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Owner Avatar Delete" ON storage.objects;
CREATE POLICY "Owner Avatar Delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid() = owner
);

-- MATCHING FUNCTIONS
-- Search profiles by similarity
DROP FUNCTION IF EXISTS match_profiles(vector, double precision, integer, uuid);
CREATE OR REPLACE FUNCTION match_profiles (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  excluded_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  ai_profile jsonb,
  semantic_summary text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    profiles.id,
    profiles.name,
    profiles.role,
    profiles.ai_profile,
    profiles.semantic_summary,
    1 - (profiles.embedding <=> query_embedding) AS similarity
  FROM profiles
  WHERE profiles.id != excluded_id
    AND 1 - (profiles.embedding <=> query_embedding) > match_threshold
  ORDER BY profiles.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Search projects by similarity
DROP FUNCTION IF EXISTS match_projects(vector, double precision, integer);
CREATE OR REPLACE FUNCTION match_projects (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  research_area text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    projects.id,
    projects.title,
    projects.description,
    projects.image_url,
    projects.research_area,
    1 - (projects.embedding <=> query_embedding) AS similarity
  FROM projects
  WHERE 1 - (projects.embedding <=> query_embedding) > match_threshold
  ORDER BY projects.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. ROLE-SPECIFIC TABLES (Plan Implementation)
-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  education_level text,
  availability text,
  looking_for text,
  program text
);

-- Researcher profiles
CREATE TABLE IF NOT EXISTS researcher_profiles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  research_stage text,
  funding_needed boolean DEFAULT false,
  needs_students boolean DEFAULT false
);

-- Investor profiles
CREATE TABLE IF NOT EXISTS investor_profiles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  funding_range text,
  investment_focus text
);

-- Industry profiles
CREATE TABLE IF NOT EXISTS industry_profiles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  sector text,
  collaboration_type text
);

-- Behavioral Learning Table (Phase 10)
CREATE TABLE IF NOT EXISTS interaction_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_id uuid, -- Profile or Project ID
  interaction_type text, -- 'click', 'accept', 'ignore', 'message'
  created_at timestamp with time zone DEFAULT now()
);

-- 6. ADMIN SECURITY policies to unblock disclosure submission & administrative review workflows
-- Allow Admin users to view, insert, update, or deletes all projects
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" ON public.projects
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'Admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'Admin'
  )
);

-- Allow Admin users to view and update other profiles (such as role elevations)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'Admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'Admin'
  )
);

