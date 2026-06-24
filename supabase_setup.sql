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

-- Ensure all workflow, tracking, and metric columns exist on public.projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS funding_amount_usd TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS open_to_collaboration BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS technical_details_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expressions_of_interest INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS requests INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS disclosure_status TEXT DEFAULT 'Submitted';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS requested_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS disclosure_timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_verification JSONB DEFAULT '{}'::jsonb;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Essential: runs with database owner privileges, bypassing RLS checks
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  );
END;
$$;

-- Helper function to check if a user has active approved 1-hour secure reveal request
CREATE OR REPLACE FUNCTION public.is_reveal_approved(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_approved_at BIGINT;
  v_one_hour_ms BIGINT := 3600000;
  v_now BIGINT;
BEGIN
  IF p_user_id IS NULL OR p_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current timestamp in milliseconds
  v_now := EXTRACT(EPOCH FROM NOW()) * 1000;
  
  -- Check the status of EOI reveal requests
  FOR v_status IN 
    SELECT status FROM public.eois 
    WHERE sender_id = p_user_id AND project_id = p_project_id
  LOOP
    IF v_status = 'released' THEN
      RETURN TRUE;
    END IF;
    IF v_status LIKE 'released:%' THEN
      BEGIN
        v_approved_at := CAST(SUBSTRING(v_status FROM 10) AS BIGINT);
        IF (v_now - v_approved_at) < v_one_hour_ms THEN
          RETURN TRUE;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL; -- safety check if bad format
      END;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- Helper function to check if a user can access a specific project storage file (retaining cover image public access)
CREATE OR REPLACE FUNCTION public.can_access_project_file(p_user_id UUID, p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_owner_id UUID;
BEGIN
  -- 1. If the file is referenced in image_url, it is a public cover image and viewable by any user
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE image_url LIKE '%' || p_object_name || '%'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. If user is null, they definitely cannot access secure briefs or docs
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Find if there is a matching project and verify access (owner or active approved reveal)
  FOR v_project_id, v_owner_id IN 
    SELECT id, owner_id FROM public.projects
    WHERE technical_details_url LIKE '%' || p_object_name || '%'
       OR requested_documents::TEXT LIKE '%' || p_object_name || '%'
  LOOP
    -- Allow PI access
    IF p_user_id = v_owner_id THEN
      RETURN TRUE;
    END IF;
    
    -- Allow if reveal request has been approved and is active
    IF public.is_reveal_approved(p_user_id, v_project_id) THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$;

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('projects', 'projects', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies for 'projects' bucket
DROP POLICY IF EXISTS "Public Project Access" ON storage.objects;
DROP POLICY IF EXISTS "Secured Project Access" ON storage.objects;
CREATE POLICY "Secured Project Access" ON storage.objects FOR SELECT USING (
  bucket_id = 'projects' AND (
    public.is_admin()
    OR auth.uid() = owner
    OR public.can_access_project_file(auth.uid(), name)
  )
);

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

-- Allow Admin users to view, insert, update, or delete all projects
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" ON public.projects
FOR ALL TO authenticated USING (
  public.is_admin()
) WITH CHECK (
  public.is_admin()
);

-- Allow research creators/owners to view, insert, update, and manage their own projects
DROP POLICY IF EXISTS "Researchers can manage their own projects" ON public.projects;
CREATE POLICY "Researchers can manage their own projects" ON public.projects
FOR ALL TO authenticated USING (
  auth.uid() = owner_id
) WITH CHECK (
  auth.uid() = owner_id
);

-- Allow everyone (including public anonymous reads and registered/authenticated users) to select projects
DROP POLICY IF EXISTS "Everyone can view public projects" ON public.projects;
CREATE POLICY "Everyone can view public projects" ON public.projects
FOR SELECT USING (
  (visibility = 'Public' OR disclosure_status = 'Published')
  AND disclosure_status IS DISTINCT FROM 'Draft'
);

-- Allow Admin users to view and update other profiles (such as role elevations) without causing infinite recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated USING (
  public.is_admin()
) WITH CHECK (
  public.is_admin()
);

