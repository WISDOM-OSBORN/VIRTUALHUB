
import { Project, NewsItem, User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

export const StorageService = {
  // Initialization
  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Session initialization error:', error);
      return null;
    }
  },

  // --- FILE UPLOAD LOGIC ---
  uploadFile: async (file: File, bucket: string): Promise<string> => {
    const bucketName = bucket.toLowerCase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Upload failed for bucket ${bucketName}:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message || 'Check storage permissions'}`);
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  },

  // Projects CRUD
  getProjects: async (): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  },

  getMyProjects: async (userId: string): Promise<Project[]> => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  },

  getTrendingProjects: async (): Promise<Project[]> => {
    try {
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: eois } = await supabase.from('eois').select('project_id');
      
      if (!projects) return [];

      return projects.map(p => {
        const inquiryCount = eois?.filter(e => e.project_id === p.id).length || 0;
        return { ...p, trendScore: inquiryCount * 10 + Math.floor(Math.random() * 50) };
      }).sort((a: any, b: any) => b.trendScore - a.trendScore).slice(0, 5);
    } catch (e) {
      return [];
    }
  },

  saveProject: async (project: Partial<Project>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId && !project.id) throw new Error("Authentication required.");

    const payload = {
      title: project.title,
      description: project.description,
      department: project.department,
      status: project.status,
      visibility: project.visibility,
      trl: project.trl,
      research_area: project.research_area,
      image_url: project.image_url,
      budget: project.budget,
      start_date: project.start_date,
      owner_id: project.owner_id || currentUserId,
      funding_amount_usd: project.funding_amount_usd,
      open_to_collaboration: project.open_to_collaboration,
      technical_details_url: project.technical_details_url,
      achievements: project.achievements,
      needs: project.needs,
      views: project.views || 0,
      expressions_of_interest: project.expressions_of_interest || 0,
      requests: project.requests || 0
    };

    if (project.id) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', project.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deleteProject: async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    return true;
  },

  // Bookmarks
  toggleBookmark: async (userId: string, projectId: string): Promise<boolean> => {
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
      return false; 
    } else {
      await supabase.from('bookmarks').insert([{ user_id: userId, project_id: projectId }]);
      return true; 
    }
  },

  isBookmarked: async (userId: string, projectId: string): Promise<boolean> => {
    if (!userId) return false;
    const { data } = await supabase.from('bookmarks').select('id').eq('user_id', userId).eq('project_id', projectId).maybeSingle();
    return !!data;
  },

  getBookmarks: async (userId: string): Promise<Project[]> => {
    if (!userId) return [];
    const { data } = await supabase.from('bookmarks').select('projects(*)').eq('user_id', userId);
    return data?.map(item => (item as any).projects).filter(p => !!p) || [];
  },

  // News
  getNews: async (): Promise<NewsItem[]> => {
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false });
    return data || [];
  },

  // Expression of Interest (EOI) / Messaging System (Full Duplex)
  submitEOI: async (project_id: string | null, user_name: string, message: string, recipient_id?: string, metric: 'expressions_of_interest' | 'requests' = 'expressions_of_interest') => {
    const { data: { session } } = await supabase.auth.getSession();
    const sender_id = session?.user?.id;
    
    if (!sender_id) {
      throw new Error("Authentication Required: Please sign in to transmit messages.");
    }

    let target_recipient = recipient_id;

    // Resolve project owner as recipient if not provided
    if (project_id && !target_recipient) {
      const { data: proj, error: projError } = await supabase.from('projects').select('owner_id').eq('id', project_id).single();
      if (projError || !proj?.owner_id) {
        throw new Error("Recipient Error: Could not resolve Project Investigator.");
      }
      target_recipient = proj.owner_id;
    }

    if (!target_recipient) {
      throw new Error("Recipient Error: No target identified for this transmission.");
    }

    const { error } = await supabase
      .from('eois')
      .insert([{ 
        project_id: project_id, 
        user_name, 
        message,
        read: false,
        sender_id: sender_id,
        recipient_id: target_recipient
      }]);
    
    if (error) {
      console.error("StorageService.submitEOI Failure:", error);
      throw new Error(error.message || "Database Error: Transmission failed.");
    }

    // Increment specified metric if project_id is present
    if (project_id) {
      StorageService.incrementProjectMetric(project_id, metric);
    }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    if (!userId) return 0;
    const { count, error } = await supabase
      .from('eois')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    
    if (error) return 0;
    return count || 0;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(5);
    
    if (error) return [];
    return data || [];
  },

  getConversations: async (userId: string) => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('eois')
      .select('*, projects(title, image_url)')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) return [];

    const threads: Record<string, any[]> = {};
    data?.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const threadKey = `${msg.project_id || 'direct'}-${partnerId}`;
      if (!threads[threadKey]) threads[threadKey] = [];
      threads[threadKey].push(msg);
    });
    
    return Object.values(threads);
  },

  markAsRead: async (userId: string, threadId: string | null, partnerId: string) => {
    if (!userId) return;
    const query = supabase
      .from('eois')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false)
      .eq('sender_id', partnerId);
    
    if (threadId) {
      query.eq('project_id', threadId);
    } else {
      query.is('project_id', null);
    }

    await query;
  },

  getEOIsForPI: async (userId: string) => {
    if (!userId) return [];
    const { data: myProjects } = await supabase.from('projects').select('id').eq('owner_id', userId);
    const projectIds = myProjects?.map(p => p.id) || [];
    let query = supabase.from('eois').select('*, projects(title, image_url)').order('created_at', { ascending: false });
    if (projectIds.length > 0) {
      const projectList = projectIds.map(id => `'${id}'`).join(',');
      query = query.or(`project_id.in.(${projectList}),recipient_id.eq.${userId}`);
    } else {
      query = query.eq('recipient_id', userId);
    }
    const { data } = await query;
    return data || [];
  },

  markEOIRead: async (id: string) => {
    const { error } = await supabase.from('eois').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  // Profiles
  getProfile: async (userId: string) => {
    if (!userId) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data;
  },

  testConnection: async () => {
    try {
      const { error } = await supabase.from('news').select('id').limit(1);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase Connection Test Failed:', error);
      return false;
    }
  },

  updateProfile: async (profile: Partial<User>) => {
    if (!profile.id) throw new Error("Profile ID is required for update.");
    
    // First, check if the profile exists to decide between insert and update
    // This can sometimes bypass RLS issues with upsert
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking profile existence:", checkError);
    }

    let result;
    if (existing) {
      result = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id);
    } else {
      result = await supabase
        .from('profiles')
        .insert([profile]);
    }

    if (result.error) {
      // Handle missing column error specifically to guide the user
      const msg = result.error.message.toLowerCase();
      if (msg.includes('column') && (msg.includes('not found') || msg.includes('does not exist'))) {
        // Attempt a "Safe Update" without the problematic fields to at least save the name/bio
        const { website_url_2, website_url_3, ...safeProfile } = profile;
        const retryResult = existing 
          ? await supabase.from('profiles').update(safeProfile).eq('id', profile.id)
          : await supabase.from('profiles').insert([safeProfile]);
        
        if (!retryResult.error) {
          throw new Error("DATABASE SCHEMA MISMATCH: Profile saved, but extra website links were skipped. FIX: Run 'ALTER TABLE profiles ADD COLUMN website_url_2 TEXT, ADD COLUMN website_url_3 TEXT;' in your Supabase SQL Editor.");
        }
      }
      
      console.error("Supabase Profile Update Error:", result.error);
      throw result.error;
    }
  },

  incrementProjectMetric: async (projectId: string, metric: 'views' | 'expressions_of_interest' | 'requests') => {
    try {
      // Fetch current value
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(metric)
        .eq('id', projectId)
        .single();
      
      if (fetchError) throw fetchError;

      const currentValue = data?.[metric] || 0;

      // Update with incremented value
      const { error: updateError } = await supabase
        .from('projects')
        .update({ [metric]: currentValue + 1 })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error(`Error incrementing ${metric}:`, error);
    }
  }
};
