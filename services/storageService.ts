
import { Project, NewsItem, User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { EmbeddingService } from './embeddingService';

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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      if (!data) return [];

      let isAdmin = false;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.role === 'Admin') {
          isAdmin = true;
        }
      }

      return data.filter((p: Project) => {
        // Admin has absolute view coverage
        if (isAdmin) return true;
        // User owns this project
        if (userId && p.owner_id === userId) return true;
        // Public projects are viewable by everyone
        if (p.visibility === 'Public') return true;
        // Internal projects are viewable only by authenticated users
        if (userId && p.visibility === 'Internal') return true;
        return false;
      });
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
      const projects = await StorageService.getProjects();
      const { data: eois } = await supabase.from('eois').select('project_id');
      
      if (!projects || projects.length === 0) return [];

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
      requests: project.requests || 0,
      embedding: project.embedding
    };

    // Auto-generate embedding if not present and we have enough data
    if (!payload.embedding && payload.title && payload.description) {
      try {
        const textToEmbed = `${payload.title} ${payload.description} ${payload.research_area || ''} ${payload.department || ''}`;
        payload.embedding = await EmbeddingService.getEmbedding(textToEmbed);
      } catch (err) {
        console.warn("Project embedding failed during save:", err);
      }
    }

    if (project.id) {
      // Security Check: Get existing project owner_id
      const { data: existingProject } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', project.id)
        .maybeSingle();
        
      if (!existingProject) throw new Error("Project not found.");
      
      let isAdmin = false;
      if (currentUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();
        if (profile?.role === 'Admin') {
          isAdmin = true;
        }
      }

      if (existingProject.owner_id !== currentUserId && !isAdmin) {
        throw new Error("Unauthorized. You do not have permission to modify this project.");
      }

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
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) throw new Error("Authentication required.");

    // Security Check: Verify owner or Admin role
    const { data: existingProject } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .maybeSingle();
      
    if (!existingProject) throw new Error("Project not found.");

    let isAdmin = false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .maybeSingle();
    if (profile?.role === 'Admin') {
      isAdmin = true;
    }

    if (existingProject.owner_id !== currentUserId && !isAdmin) {
      throw new Error("Unauthorized. You do not have permission to withdraw this project.");
    }

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
        recipient_id: target_recipient,
        status: 'pending'
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

  updateEOIStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('eois').update({ status }).eq('id', id);
    if (error) throw error;
  },

  checkRevealApproved: async (userId: string, projectId: string): Promise<boolean> => {
    if (!userId || !projectId) return false;
    const { data, error } = await supabase
      .from('eois')
      .select('status')
      .eq('sender_id', userId)
      .eq('project_id', projectId);
    
    if (error || !data || data.length === 0) return false;
    
    return data.some(row => {
      if (row.status === 'released') return true;
      if (row.status && row.status.startsWith('released:')) {
        const approvedAt = parseInt(row.status.split(':')[1], 10);
        const oneHourMs = 60 * 60 * 1000;
        return Date.now() - approvedAt < oneHourMs;
      }
      return false;
    });
  },

  getRevealApprovalDetails: async (userId: string, projectId: string) => {
    if (!userId || !projectId) return { approved: false, remainingMinutes: 0 };
    const { data, error } = await supabase
      .from('eois')
      .select('status')
      .eq('sender_id', userId)
      .eq('project_id', projectId);
    
    if (error || !data || data.length === 0) return { approved: false, remainingMinutes: 0 };
    
    let approved = false;
    let remainingMinutes = 0;
    
    data.forEach(row => {
      if (row.status === 'released') {
        approved = true;
        remainingMinutes = 60; // legacy default
      } else if (row.status && row.status.startsWith('released:')) {
        const approvedAt = parseInt(row.status.split(':')[1], 10);
        const oneHourMs = 60 * 60 * 1000;
        const elapsed = Date.now() - approvedAt;
        if (elapsed < oneHourMs) {
          approved = true;
          remainingMinutes = Math.ceil((oneHourMs - elapsed) / (60 * 1000));
        }
      }
    });
    
    return { approved, remainingMinutes };
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

  updateProfile: async (profile: Partial<User & { embedding?: number[], semantic_summary?: string, answers?: any }>) => {
    if (!profile.id) throw new Error("Profile ID is required for update.");
    
    // Security check: Ensure current user possesses ownership over this record, or holds an Administrative role
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) throw new Error("Authentication required.");

    // Retrieve active profile structure
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle();

    let isAdmin = false;
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .maybeSingle();
    if (currentUserProfile?.role === 'Admin') {
      isAdmin = true;
    }

    if (profile.id !== currentUserId && !isAdmin) {
      throw new Error("Unauthorized: Profile mutation request is invalid.");
    }

    let result;
    const { answers, ...mainProfile } = profile as any;
    
    // Safety check: Ensure embedding is exactly 768 dimensions using central helper
    if (mainProfile.embedding && Array.isArray(mainProfile.embedding)) {
      mainProfile.embedding = EmbeddingService.ensureDimension(mainProfile.embedding, 768);
    }

    try {
      if (existing) {
        result = await supabase
          .from('profiles')
          .update(mainProfile)
          .eq('id', profile.id);
      } else {
        result = await supabase
          .from('profiles')
          .insert([mainProfile]);
      }

      if (result.error) {
        throw result.error;
      }
    } catch (err: any) {
      // If it's a schema/cache column error, fall back to core columns only
      const errorStr = (err?.message || "").toLowerCase();
      const isColumnError = err?.code === 'PGRST204' || errorStr.includes('column') || errorStr.includes('cache');
      
      if (isColumnError) {
        console.warn("Schema mismatch detected, falling back to core profiles columns:", err);
        const coreProfile = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role
        };
        
        if (existing) {
          result = await supabase
            .from('profiles')
            .update(coreProfile)
            .eq('id', profile.id);
        } else {
          result = await supabase
            .from('profiles')
            .insert([coreProfile]);
        }
        
        if (result.error) {
          console.error("Supabase Profile Fallback Update Error:", result.error);
          throw result.error;
        }
      } else {
        console.error("Supabase Profile Update Error:", err);
        throw err;
      }
    }

    // Sync to Role Specific Tables
    if (answers && profile.role) {
      if (profile.role === UserRole.Student) {
        await supabase.from('student_profiles').upsert({
          user_id: profile.id,
          education_level: answers.edu_level,
          availability: answers.availability,
          looking_for: Array.isArray(answers.looking_for) ? answers.looking_for.join(', ') : answers.looking_for,
          program: answers.program
        });
      } else if (profile.role === UserRole.Researcher) {
        await supabase.from('researcher_profiles').upsert({
          user_id: profile.id,
          research_stage: answers.research_stage,
          funding_needed: answers.funding_needed,
          needs_students: answers.needs_students
        });
      } else if (profile.role === UserRole.Investor) {
        await supabase.from('investor_profiles').upsert({
          user_id: profile.id,
          funding_range: answers.funding_range,
          investment_focus: answers.investment_focus
        });
      } else if (profile.role === UserRole.IndustryPartner) {
        await supabase.from('industry_profiles').upsert({
          user_id: profile.id,
          sector: answers.sector,
          collaboration_type: answers.collab_type
        });
      }
    }
  },

  getMatches: async (userId: string, embedding: number[]) => {
    if (!userId || !embedding) return { profiles: [], projects: [] };

    try {
      const [{ data: profiles }, { data: projects }] = await Promise.all([
        supabase.rpc('match_profiles', {
          query_embedding: embedding,
          match_threshold: 0.0,
          match_count: 20,
          excluded_id: userId
        }),
        supabase.rpc('match_projects', {
          query_embedding: embedding,
          match_threshold: 0.0,
          match_count: 20
        })
      ]);

      let finalProfiles = profiles || [];
      let finalProjects = projects || [];

      // Fallback 1: If no vector-matched profiles are returned (e.g. similarity is NULL due to zero-vectors or NULL embeddings), fetch other users directly.
      if (finalProfiles.length === 0) {
        console.log("No vector-matched profiles found. Fetching other active researchers from DB directly for fallback.");
        const { data: fallbackProfiles } = await supabase
          .from('profiles')
          .select('id, name, role, ai_profile, semantic_summary, avatar_url')
          .neq('id', userId)
          .limit(10);

        if (fallbackProfiles && fallbackProfiles.length > 0) {
          finalProfiles = fallbackProfiles.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role || 'Researcher',
            ai_profile: p.ai_profile,
            semantic_summary: p.semantic_summary || 'Digital identity registered in University of Ghana Ecosystem.',
            similarity: 0.82, // Warm baseline similarity for fallback matching
            avatar_url: p.avatar_url
          }));
        }
      }

      // Fallback 2: If no vector-matched projects are returned, fetch the latest projects directly.
      if (finalProjects.length === 0) {
        console.log("No vector-matched projects found. Fetching active disclosures from DB directly for fallback.");
        const { data: fallbackProjects } = await supabase
          .from('projects')
          .select('id, title, description, image_url, research_area')
          .limit(10);

        if (fallbackProjects && fallbackProjects.length > 0) {
          finalProjects = fallbackProjects.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            image_url: p.image_url,
            research_area: p.research_area || 'General Research',
            similarity: 0.80 // Warm baseline similarity for fallback projects
          }));
        }
      }

      // Enrich profiles with avatar_url
      if (finalProfiles.length > 0) {
        try {
          const profileIds = finalProfiles.map((p: any) => p.id);
          const { data: enrichedData, error: enrichError } = await supabase
            .from('profiles')
            .select('id, avatar_url')
            .in('id', profileIds);
          
          if (!enrichError && enrichedData && enrichedData.length > 0) {
            const avatarMap = new Map(enrichedData.map(row => [row.id, row.avatar_url]));
            finalProfiles = finalProfiles.map((p: any) => ({
              ...p,
              avatar_url: avatarMap.get(p.id) || p.avatar_url || null
            }));
          }
        } catch (e) {
          console.warn("Could not enrich matched profiles with avatar_urls:", e);
        }
      }

      // Secure Project Filter: Ensure matched/fallback projects match user's visibility permissions
      if (finalProjects.length > 0) {
        try {
          const projectIds = finalProjects.map((p: any) => p.id);
          const { data: visData } = await supabase
            .from('projects')
            .select('id, visibility, owner_id')
            .in('id', projectIds);
          
          if (visData) {
            const visMap = new Map(visData.map(row => [row.id, row]));
            
            let isAdmin = false;
            if (userId) {
              const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
              if (profile?.role === 'Admin') {
                isAdmin = true;
              }
            }

            finalProjects = finalProjects.filter((p: any) => {
              const row = visMap.get(p.id);
              if (!row) return false;
              if (isAdmin) return true;
              if (userId && row.owner_id === userId) return true;
              if (row.visibility === 'Public') return true;
              if (userId && row.visibility === 'Internal') return true;
              return false;
            });
          }
        } catch (visErr) {
          console.warn("Could not secure match_projects results:", visErr);
          finalProjects = []; // Safely default to empty if visibility checks fail
        }
      }

      return {
        profiles: finalProfiles,
        projects: finalProjects
      };
    } catch (error) {
      console.error("Matching engine error:", error);
      // Ultimate absolute fallback from catches
      try {
        const [{ data: fallbackProfiles }, { data: fallbackProjects }] = await Promise.all([
          supabase.from('profiles').select('id, name, role, ai_profile, semantic_summary, avatar_url').neq('id', userId).limit(10),
          supabase.from('projects').select('id, title, description, image_url, research_area, visibility, owner_id').limit(20)
        ]);

        let isAdmin = false;
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
          if (profile?.role === 'Admin') {
            isAdmin = true;
          }
        }

        const secureFallbackProjects = (fallbackProjects || []).filter((p: any) => {
          if (isAdmin) return true;
          if (userId && p.owner_id === userId) return true;
          if (p.visibility === 'Public') return true;
          if (userId && p.visibility === 'Internal') return true;
          return false;
        }).slice(0, 10);

        return {
          profiles: (fallbackProfiles || []).map(p => ({
            id: p.id,
            name: p.name,
            role: p.role || 'Collaborator',
            ai_profile: p.ai_profile,
            semantic_summary: p.semantic_summary || 'Profile active in ecosystem.',
            similarity: 0.75,
            avatar_url: p.avatar_url
          })),
          projects: secureFallbackProjects.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            image_url: p.image_url,
            research_area: p.research_area || 'General Innovation',
            similarity: 0.75
          }))
        };
      } catch (dbError) {
        console.error("Critical fallback database query failed:", dbError);
        return { profiles: [], projects: [] };
      }
    }
  },

  logInteraction: async (userId: string, targetId: string, type: 'click' | 'accept' | 'ignore' | 'message') => {
    try {
      await supabase.from('interaction_logs').insert([{
        user_id: userId,
        target_id: targetId,
        interaction_type: type
      }]);
    } catch (err) {
      console.warn("Logging failed:", err);
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
  },

  // --- ADMINISTRATIVE PORTAL OPERATIONS ---
  verifyAdmin: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      return profile?.role === 'Admin';
    } catch (e) {
      return false;
    }
  },

  adminGetAllProfiles: async (): Promise<User[]> => {
    try {
      const isAdmin = await StorageService.verifyAdmin();
      if (!isAdmin) throw new Error("Unauthorized access. Admin privileges required.");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching admin profiles:', err);
      throw err;
    }
  },

  adminGetAllEOIs: async (): Promise<any[]> => {
    try {
      const isAdmin = await StorageService.verifyAdmin();
      if (!isAdmin) throw new Error("Unauthorized access. Admin privileges required.");

      const { data, error } = await supabase
        .from('eois')
        .select(`
          *,
          projects (
            title
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching admin EOIs:', err);
      throw err;
    }
  },

  adminUpdateProfileRole: async (userId: string, role: UserRole) => {
    try {
      const isAdmin = await StorageService.verifyAdmin();
      if (!isAdmin) throw new Error("Unauthorized access. Admin privileges required.");

      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating profile role:', err);
      throw err;
    }
  },

  adminSaveNewsItem: async (newsItem: Partial<NewsItem>) => {
    try {
      const isAdmin = await StorageService.verifyAdmin();
      if (!isAdmin) throw new Error("Unauthorized access. Admin privileges required.");

      const payload = {
        title: newsItem.title,
        category: newsItem.category,
        summary: newsItem.summary,
        image_url: newsItem.image_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop',
        published_at: newsItem.published_at || new Date().toISOString(),
        external_url: newsItem.external_url || '',
        is_ai_generated: newsItem.is_ai_generated || false,
        source_name: newsItem.source_name || 'UG ORID Directorates'
      };

      if (newsItem.id) {
        const { data, error } = await supabase
          .from('news')
          .update(payload)
          .eq('id', newsItem.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('news')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.error('Error saving news item:', err);
      throw err;
    }
  },

  adminDeleteNewsItem: async (newsId: string) => {
    try {
      const isAdmin = await StorageService.verifyAdmin();
      if (!isAdmin) throw new Error("Unauthorized access. Admin privileges required.");

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', newsId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting news item:', err);
      throw err;
    }
  }
};
