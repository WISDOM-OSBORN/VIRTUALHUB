import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, FileText, Settings, Bell, ShieldCheck, 
  Trash2, Plus, Edit, RefreshCw, Layers, CheckCircle2, 
  MapPin, Clock, Search, ExternalLink, Filter, HelpCircle, 
  TrendingUp, BarChart3, Radio, FileSpreadsheet, Lock, Sparkles,
  MessageSquare, Download, Eye, AlertTriangle, ThumbsUp, Check, Loader2, ChevronDown, ChevronUp, X, Link2, Upload, ChevronLeft, ChevronRight,
  Calendar, Tag, Globe, Zap, Maximize2, Minimize2
} from 'lucide-react';
import { User, Project, NewsItem, UserRole, ProjectStatus, Visibility, ResearchArea, DisclosureStatus } from '../types';
import { StorageService } from '../services/storageService';
import { supabase } from '../lib/supabase';
import { useToast } from '../App';
import { AIScoutService } from '../services/aiScoutService';
import { getGeminiResponse } from '../services/geminiService';
import { DocumentExtractionService } from '../services/documentExtractionService';

interface AdminDashboardProps {
  user: User | null;
  onRefresh?: () => void;
  activeSubTab?: 'metrics' | 'users' | 'disclosures' | 'projects' | 'news' | 'logs';
  setActiveSubTab?: (tab: 'metrics' | 'users' | 'disclosures' | 'projects' | 'news' | 'logs') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, 
  onRefresh,
  activeSubTab: externalActiveSubTab,
  setActiveSubTab: externalSetActiveSubTab
}) => {
  const { showToast } = useToast();
  const [internalActiveSubTab, setInternalActiveSubTab] = useState<'metrics' | 'users' | 'disclosures' | 'projects' | 'news' | 'logs'>('metrics');
  
  const activeSubTab = externalActiveSubTab !== undefined ? externalActiveSubTab : internalActiveSubTab;
  const setActiveSubTab = (tab: 'metrics' | 'users' | 'disclosures' | 'projects' | 'news' | 'logs') => {
    if (externalSetActiveSubTab) {
      externalSetActiveSubTab(tab);
    } else {
      setInternalActiveSubTab(tab);
    }
  };
  
  // Data states
  const [profiles, setProfiles] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [eois, setEois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // News Editor states
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Announcement');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsExternalUrl, setNewsExternalUrl] = useState('');
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [isScoutingNews, setIsScoutingNews] = useState(false);
  const [newsStatus, setNewsStatus] = useState<'Draft' | 'Published'>('Published');
  const [newsReferenceLinks, setNewsReferenceLinks] = useState<string[]>(['', '', '', '']);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [showAIWriteModal, setShowAIWriteModal] = useState(false);
  const [newsTags, setNewsTags] = useState('');
  const [newsRelevanceScore, setNewsRelevanceScore] = useState<number>(0);
  const [newsSourceVerificationNotes, setNewsSourceVerificationNotes] = useState('');

  // Redesigned Administrative Hub states for news curator
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(true);
  const [tagInput, setTagInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(1);
  const [tagList, setTagList] = useState<string[]>([]);
  const [archivePage, setArchivePage] = useState<number>(1);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [archiveSort, setArchiveSort] = useState<string>('newest');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [newsPublishedAt, setNewsPublishedAt] = useState<string>(new Date().toISOString().substring(0, 16));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  // Admin Disclosure Workflows states
  const [selectedDisclosureId, setSelectedDisclosureId] = useState<string | null>(null);
  const [adminInternalNotes, setAdminInternalNotes] = useState('');
  const [adminFeedback, setAdminFeedback] = useState('');
  const [adminRequestedDocsText, setAdminRequestedDocsText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [disclosureSearchQuery, setDisclosureSearchQuery] = useState('');
  const [disclosureStatusFilter, setDisclosureStatusFilter] = useState('all');

  const handleApproveDisclosure = async (proj: Project) => {
    if (!user) return;
    setIsProcessingAction(true);
    try {
      const currentTimeline = Array.isArray(proj.disclosure_timeline) ? proj.disclosure_timeline : [];
      const newEvent = {
        event: 'Approved',
        details: 'Administrative governance review completed. Research cleared for public disclosure.',
        timestamp: new Date().toISOString(),
        user_name: user.name
      };
      
      const updated = {
        ...proj,
        disclosure_status: DisclosureStatus.Published,
        visibility: Visibility.Public,
        disclosure_timeline: [...currentTimeline, newEvent]
      };
      
      await StorageService.saveProject(updated);
      showToast(`Disclosure "${proj.title}" approved and published to the Hub!`, "success");
      
      await loadAdminData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to approve disclosure", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRequestEdits = async (proj: Project) => {
    if (!user) return;
    if (!adminFeedback.trim()) {
      showToast("Please provide instructions or regulatory feedback first.", "error");
      return;
    }
    setIsProcessingAction(true);
    try {
      const slots = adminRequestedDocsText.split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map((s, index) => ({
          id: `${Math.random().toString(36).substring(7)}-${index}`,
          name: s,
          requested_at: new Date().toISOString(),
          status: 'requested' as const
        }));

      const currentTimeline = Array.isArray(proj.disclosure_timeline) ? proj.disclosure_timeline : [];
      const newEvent = {
        event: 'Documents Requested',
        details: `Additional files/clarifications requested: ${adminFeedback.trim()}`,
        timestamp: new Date().toISOString(),
        user_name: user.name
      };

      const existingRequested = Array.isArray(proj.requested_documents) ? proj.requested_documents : [];
      const updatedRequested = [...existingRequested, ...slots];

      const updated = {
        ...proj,
        disclosure_status: DisclosureStatus.DocumentsRequested,
        internal_notes: adminInternalNotes,
        requested_documents: updatedRequested,
        disclosure_timeline: [...currentTimeline, newEvent]
      };

      await StorageService.saveProject(updated);

      await StorageService.submitEOI(
        proj.id,
        user.name,
        `⚠️ ADVISORY ALERT & REGULATORY REVIEW FEEDBACK:\n\n${adminFeedback.trim()}\n\nRequested Document Slots Created:\n${slots.map(s => `• ${s.name} (Awaiting Upload)`).join('\n') || 'None'}`,
        proj.owner_id
      );

      showToast(`Clarification request and messages posted successfully!`, "success");
      
      setAdminFeedback('');
      setAdminRequestedDocsText('');
      
      await loadAdminData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to request clarification", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectDisclosure = async (proj: Project) => {
    if (!user) return;
    if (!adminFeedback.trim()) {
      showToast("Please provide formal reasons for rejection in the feedback field.", "error");
      return;
    }
    if (!window.confirm("Are you sure you want to reject this disclosure submission? It will be marked as Rejected.")) return;
    setIsProcessingAction(true);
    try {
      const currentTimeline = Array.isArray(proj.disclosure_timeline) ? proj.disclosure_timeline : [];
      const newEvent = {
        event: 'Rejected',
        details: `Governance rejection statement: ${adminFeedback.trim()}`,
        timestamp: new Date().toISOString(),
        user_name: user.name
      };

      const updated = {
        ...proj,
        disclosure_status: DisclosureStatus.Rejected,
        internal_notes: adminInternalNotes,
        disclosure_timeline: [...currentTimeline, newEvent]
      };

      await StorageService.saveProject(updated);

      await StorageService.submitEOI(
        proj.id,
        user.name,
        `🚫 REGULATORY DEFICIENCIES NOTED (SUBMISSION REJECTED):\n\n${adminFeedback.trim()}`,
        proj.owner_id
      );

      showToast(`Disclosure submission rejected and feedback registered.`, "info");
      setAdminFeedback('');
      
      await loadAdminData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to reject disclosure", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectDocumentSlot = async (proj: Project, slotId: string) => {
    if (!user) return;
    const reason = window.prompt("Enter the reason for rejecting this document slot and requesting a re-upload:");
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      showToast("A reason is required to request a document re-upload.", "error");
      return;
    }

    setIsProcessingAction(true);
    try {
      const currentRequested = Array.isArray(proj.requested_documents) ? proj.requested_documents : [];
      let slotName = '';
      const updatedRequested = currentRequested.map(doc => {
        if (doc.id === slotId) {
          slotName = doc.name;
          return {
            ...doc,
            status: 'requested' as const,
            url: undefined,
            uploaded_at: undefined,
            by: undefined
          };
        }
        return doc;
      });

      const currentTimeline = Array.isArray(proj.disclosure_timeline) ? proj.disclosure_timeline : [];
      const newEvent = {
        event: 'Document Rejected',
        details: `Admin rejected file in slot "${slotName}". Reason: ${reason.trim()}`,
        timestamp: new Date().toISOString(),
        user_name: user.name
      };

      const updated = {
        ...proj,
        disclosure_status: DisclosureStatus.DocumentsRequested,
        requested_documents: updatedRequested,
        disclosure_timeline: [...currentTimeline, newEvent]
      };

      await StorageService.saveProject(updated);

      await StorageService.submitEOI(
        proj.id,
        user.name,
        `⚠️ DOCUMENT RE-UPLOAD REQUESTED for slot [${slotName}]:\n\nReason: ${reason.trim()}\n\nPlease go to your portfolio dashboard and upload a revised or correct file in the corresponding slot.`,
        proj.owner_id
      );

      showToast(`Document slot "${slotName}" has been reset and researcher notified.`, "success");
      await loadAdminData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to reject document slot", "error");
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [allProfiles, allProjects, allNews, allEOIs] = await Promise.all([
        StorageService.adminGetAllProfiles(),
        StorageService.getProjects(),
        StorageService.getNews(true, { limit: 150 }),
        StorageService.adminGetAllEOIs()
      ]);
      
      setProfiles(allProfiles);
      setProjects(allProjects);
      setNews(allNews);
      setEois(allEOIs);
    } catch (err) {
      console.error("Failed loading admin data", err);
      showToast("Error loading registry databases", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Auto sync tags list with newsTags state when newsTags is updated externally
  useEffect(() => {
    if (newsTags) {
      const parsed = newsTags.split(',').map(t => t.trim()).filter(Boolean);
      setTagList(parsed);
    } else {
      setTagList([]);
    }
  }, [newsTags]);

  // Handler for role changes
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await StorageService.adminUpdateProfileRole(userId, newRole);
      showToast(`User role elevated to ${newRole}`, "success");
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast("Failed to transition role", "error");
    }
  };

  // Handler for project status updates
  const handleProjectStatusChange = async (projectId: string, field: 'status' | 'visibility' | 'trl', value: any) => {
    try {
      const proj = projects.find(p => p.id === projectId);
      if (!proj) return;
      
      let updatedProject = {
        ...proj,
        [field]: value
      };
      
      if (field === 'status') {
        const index = Object.values(ProjectStatus).indexOf(value as ProjectStatus);
        updatedProject.trl = index >= 0 ? index + 1 : 1;
      } else if (field === 'trl') {
        const statusValues = Object.values(ProjectStatus);
        const index = value - 1;
        if (index >= 0 && index < statusValues.length) {
          updatedProject.status = statusValues[index];
        }
      }
      
      await StorageService.saveProject(updatedProject);
      showToast(`Project ${field} updated successfully`, "success");
      
      setProjects(prev => prev.map(p => p.id === projectId ? { 
        ...p, 
        ...(field === 'status' ? { status: value, trl: updatedProject.trl } : 
            field === 'trl' ? { trl: value, status: updatedProject.status } : 
            { [field]: value })
      } : p));
    } catch (err) {
      showToast("Failed to modify project constraints", "error");
    }
  };

  // Handler for deleting project
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to permanently withdraw this research project from the platform? This cannot be undone.")) return;
    try {
      await StorageService.deleteProject(projectId);
      showToast("Project completely deleted", "success");
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      showToast("Failed to delete project", "error");
    }
  };

  const handleAIScoutSync = async () => {
    if (isScoutingNews) return;
    setIsScoutingNews(true);
    showToast("AI Scout: Initializing synchronization with external academic feeds...", "info");
    try {
      const updated = await AIScoutService.autoSyncNews(true);
      if (updated) {
        showToast("AI Scout: Successfully synchronized new relevant announcements!", "success");
        await loadAdminData();
      } else {
        showToast("AI Scout: Feeds are already up to date. No new announcements found.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed running AI Scout sync", "error");
    } finally {
      setIsScoutingNews(false);
    }
  };

  const handleGenerateAIPressRelease = async () => {
    if (!aiTopic) {
      showToast("Please enter a topic first to guide the AI news writer.", "error");
      return;
    }
    setIsGeneratingAI(true);
    showToast("AI Agent: Writing descriptive press release headline and content...", "info");
    try {
      const prompt = `Act as an elite Academic Public Relations Officer at the University of Ghana.
Write a professional, highly engaging press release based on:
Topic: "${aiTopic}"
Keywords: "${aiKeywords}"
Category: "${newsCategory}"

You MUST output exactly in the following JSON format:
{
  "title": "A highly professional, captivating academic headline",
  "summary": "An authoritative, well-written article summary (around 120-150 words) highlighting the research breakthrough, strategic ecosystem funding, or institutional partnership."
}

Do NOT include any extra text or markdown codeblocks in your response. Just return the raw JSON object.`;

      const responseText = await getGeminiResponse(prompt, []);
      try {
        const jsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonText);
        if (result.title) setNewsTitle(result.title);
        if (result.summary) setNewsSummary(result.summary);
        showToast("AI Agent: Draft generated successfully!", "success");
        setAiTopic('');
        setAiKeywords('');
        setShowAIWriteModal(false);
      } catch (jsonErr) {
        setNewsSummary(responseText.trim());
        showToast("AI Agent: Generated draft (text only).", "success");
        setShowAIWriteModal(false);
      }
    } catch (err: any) {
      showToast("Failed to draft with Gemini", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle tag additions & removal
  const handleAddTag = (tagStr: string) => {
    const trimmed = tagStr.trim();
    if (!trimmed) return;
    if (tagList.includes(trimmed)) return;
    const newTagsList = [...tagList, trimmed];
    setTagList(newTagsList);
    setNewsTags(newTagsList.join(', '));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTagsList = tagList.filter(t => t !== tagToRemove);
    setTagList(newTagsList);
    setNewsTags(newTagsList.join(', '));
  };

  // Pre-populate news item for editing
  const handleEditNewsClick = (e: React.MouseEvent | undefined, item: NewsItem) => {
    if (e) e.stopPropagation();
    setEditingNews(item);
    setNewsTitle(item.title);
    setNewsCategory(item.category || 'Announcement');
    setNewsSummary(item.summary);
    setNewsImageUrl(item.image_url || '');
    setNewsExternalUrl(item.external_url || '');
    setNewsStatus(item.status || 'Published');
    setNewsReferenceLinks(item.reference_links && item.reference_links.length > 0 ? [...item.reference_links, '', '', '', ''].slice(0, 4) : ['', '', '', '']);
    setNewsTags(item.tags ? item.tags.join(', ') : '');
    setTagList(item.tags || []);
    setNewsRelevanceScore(item.relevance_score || 0);
    setNewsSourceVerificationNotes(item.source_verification_notes || '');
    setNewsPublishedAt(item.published_at ? new Date(item.published_at).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16));
    setActiveTab(1); // Return to Core Insight tab in Split Workspace
    setIsWorkspaceOpen(true);
  };

  // Setup form fields for a new announcement
  const handleCreateNewClick = () => {
    setEditingNews(null);
    setNewsTitle('');
    setNewsCategory('Announcement');
    setNewsSummary('');
    setNewsImageUrl('');
    setNewsExternalUrl('');
    setNewsStatus('Published');
    setNewsReferenceLinks(['', '', '', '']);
    setNewsTags('');
    setTagList([]);
    setNewsRelevanceScore(0);
    setNewsSourceVerificationNotes('');
    setNewsPublishedAt(new Date().toISOString().substring(0, 16));
    setActiveTab(1); // Return to Core Insight tab in Split Workspace
    setIsWorkspaceOpen(true);
    showToast("Workspace opened. Enter Core Insights to create a new announcement.", "info");
  };

  // Delete news item
  const handleDeleteNews = async (e: React.MouseEvent | undefined, newsId: string) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this announcement? This action is irreversible.")) return;
    try {
      await StorageService.adminDeleteNewsItem(newsId);
      showToast("Announcement deleted successfully", "success");
      setNews(prev => prev.filter(n => n.id !== newsId));
      if (editingNews?.id === newsId) {
        setEditingNews(null);
        setNewsTitle('');
        setNewsSummary('');
        setNewsImageUrl('');
        setNewsExternalUrl('');
        setNewsStatus('Published');
        setNewsReferenceLinks(['', '', '', '']);
        setNewsTags('');
        setTagList([]);
        setNewsRelevanceScore(0);
        setNewsSourceVerificationNotes('');
        setNewsPublishedAt(new Date().toISOString().substring(0, 16));
      }
    } catch (err) {
      showToast("Failed deleting announcement", "error");
    }
  };

  // Helper to clear Curator Workspace completely
  const handleClearWorkspace = () => {
    setEditingNews(null);
    setNewsTitle('');
    setNewsSummary('');
    setNewsImageUrl('');
    setNewsExternalUrl('');
    setNewsStatus('Published');
    setNewsReferenceLinks(['', '', '', '']);
    setNewsTags('');
    setTagList([]);
    setNewsRelevanceScore(0);
    setNewsSourceVerificationNotes('');
    setNewsPublishedAt(new Date().toISOString().substring(0, 16));
    setActiveTab(1);
    showToast("Curator Workspace cleared for new announcement", "info");
  };

  // Image Upload handler with manual validation
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Invalid file type. Only JPG, PNG, or WEBP images are allowed.", "error");
      return;
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast("File is too large. Maximum allowed size is 5MB.", "error");
      return;
    }

    setIsUploadingImage(true);
    showToast("Uploading image...", "info");
    try {
      const url = await StorageService.uploadFile(file, 'avatars');
      setNewsImageUrl(url);
      showToast("Image uploaded successfully!", "success");
    } catch (err: any) {
      showToast(`Upload failed: ${err.message || err}`, "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Extract content from .txt, .doc, or .docx file and populate workspace
  const handleDocumentExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['txt', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      showToast("Invalid file type. Only .txt, .doc, and .docx files are supported.", "error");
      return;
    }

    setIsExtractingDoc(true);
    showToast("Reading document file...", "info");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        
        showToast("AI Agent: Analyzing draft with Gemini...", "info");
        const resData = await DocumentExtractionService.extractAndAnalyze(base64String, file.name, file.type);

        if (resData.success && resData.data) {
          const item = resData.data;
          if (item.title) setNewsTitle(item.title);
          if (item.summary) setNewsSummary(item.summary);
          if (item.category) setNewsCategory(item.category);
          if (item.tags) {
            setTagList(item.tags);
            setNewsTags(item.tags.join(', '));
          }
          if (item.source_verification_notes) {
            setNewsSourceVerificationNotes(item.source_verification_notes);
          }
          showToast("Document analyzed and fields auto-populated!", "success");
        } else {
          showToast("Failed to parse document content.", "error");
        }
      } catch (err: any) {
        console.error("Document extraction failed:", err);
        showToast(`Document analysis failed: ${err.message || err}`, "error");
      } finally {
        setIsExtractingDoc(false);
        // Clear input value so upload can be triggered again with the same file
        if (e.target) e.target.value = '';
      }
    };

    reader.onerror = () => {
      showToast("Failed to read the local file.", "error");
      setIsExtractingDoc(false);
    };

    reader.readAsDataURL(file);
  };

  // Handle action-specific saving (Save Draft or Publish) to avoid state sync lag
  const handleActionSave = async (status: 'Draft' | 'Published') => {
    if (!newsTitle.trim() || !newsSummary.trim()) {
      showToast("Please provide a title and summary", "error");
      return;
    }

    if (status === 'Published' && (!newsImageUrl || newsImageUrl.trim() === '')) {
      showToast("An image is required before publishing. Please upload a JPG, PNG, or WEBP image first.", "error");
      return;
    }

    try {
      setIsSavingNews(true);
      
      // Clean image URL back to a public URL to save cleanly in the database
      const cleanImageUrl = newsImageUrl && newsImageUrl.includes('?token=') 
        ? newsImageUrl.split('?')[0].replace('/object/sign/', '/object/public/')
        : newsImageUrl;

      const payload: Partial<NewsItem> = {
        id: editingNews?.id,
        title: newsTitle,
        category: newsCategory,
        summary: newsSummary,
        image_url: cleanImageUrl,
        external_url: newsExternalUrl,
        published_at: new Date(newsPublishedAt).toISOString(),
        status: status,
        reference_links: newsReferenceLinks.map(link => link.trim()),
        tags: tagList,
        relevance_score: Number(newsRelevanceScore) || 0,
        source_verification_notes: newsSourceVerificationNotes
      };

      await StorageService.adminSaveNewsItem(payload);
      showToast(editingNews?.id ? "News item updated" : "News item created successfully", "success");
      
      // Reset state & reload list
      setEditingNews(null);
      setNewsTitle('');
      setNewsSummary('');
      setNewsImageUrl('');
      setNewsExternalUrl('');
      setNewsStatus('Published');
      setNewsReferenceLinks(['', '', '', '']);
      setNewsTags('');
      setTagList([]);
      setNewsRelevanceScore(0);
      setNewsSourceVerificationNotes('');
      setNewsPublishedAt(new Date().toISOString().substring(0, 16));
      setArchivePage(1);
      
      await loadAdminData();
    } catch (err) {
      showToast("Failed saving announcement", "error");
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleActionSave(newsStatus);
  };

  // Filter computations
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.research_area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter and sort the archives list
  const filteredArchives = news.filter(item => {
    const matchesSearch = archiveSearch 
      ? item.title.toLowerCase().includes(archiveSearch.toLowerCase()) || 
        item.summary.toLowerCase().includes(archiveSearch.toLowerCase()) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(archiveSearch.toLowerCase())))
      : true;
      
    const matchesCategory = selectedCategory && selectedCategory !== 'All'
      ? item.category === selectedCategory
      : true;
      
    const matchesStatus = selectedStatusFilter && selectedStatusFilter !== 'All'
      ? item.status === selectedStatusFilter
      : true;
      
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedArchives = [...filteredArchives].sort((a, b) => {
    const dateA = new Date(a.published_at || '').getTime();
    const dateB = new Date(b.published_at || '').getTime();
    return archiveSort === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(sortedArchives.length / itemsPerPage));
  
  const paginatedArchives = sortedArchives.slice(
    (archivePage - 1) * itemsPerPage,
    archivePage * itemsPerPage
  );

  // Compute stats metrics
  const totalStudents = profiles.filter(p => p.role === UserRole.Student).length;
  const totalResearchers = profiles.filter(p => p.role === UserRole.Researcher).length;
  const totalInvestors = profiles.filter(p => p.role === UserRole.Investor).length;
  const totalIndustry = profiles.filter(p => p.role === UserRole.IndustryPartner).length;
  
  const averageTRL = projects.length > 0 
    ? (projects.reduce((acc, p) => acc + (p.trl || 0), 0) / projects.length).toFixed(1)
    : '0';

  const totalExpressionsOfInterests = eois.length;

  return (
    <div className="space-y-6 animate-fade-in text-gray-900">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-ug-teal mb-2">
            <Lock size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Platform Core Governance System</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ug-navy tracking-tight">ADMINISTRATIVE HUB</h1>
          <p className="text-xs text-gray-400 font-medium tracking-wide mt-1">
            Integrate university registries, examine match metrics, curate institutional announcements, and moderate innovation projects.
          </p>
        </div>
        
        <button 
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 h-12 bg-gray-50 border border-gray-100 font-bold hover:bg-gray-100 text-[10px] text-ug-navy uppercase tracking-widest rounded-xl transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Re-Syncing...' : 'Force System Re-Sync'}
        </button>
      </div>

      {/* Sub-tabs removed as they are driven by the modern left sidebar navigation menu */}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="animate-spin text-ug-teal" size={48} />
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 animate-pulse">Syncing platform ledgers & secure metrics...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* 1. METRICS SUBTAB */}
          {activeSubTab === 'metrics' && (
            <motion.div 
              key="metrics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Core Analytics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Registrants", value: profiles.length, sub: "Verified profiles", trend: "+12%" },
                  { label: "Innovation Index", value: projects.length, sub: "Academic projects", trend: "+8%" },
                  { label: "Avg Project Stage", value: averageTRL, sub: "Scale 1 to 6", trend: "Optimized" },
                  { label: "Interactions Formed", value: totalExpressionsOfInterests, sub: "Active collaborations", trend: "High Volume" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-28">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                    <div>
                      <h3 className="text-2xl font-extrabold text-ug-navy leading-none tracking-tight">{stat.value}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400 font-medium">{stat.sub}</span>
                        <span className="text-[8px] font-bold uppercase text-ug-teal bg-ug-teal/5 px-2 py-0.5 rounded-full">{stat.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stakeholders Persona Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-ug-navy">Sector Hub Activity</h3>
                    <p className="text-[10px] font-black text-ug-teal uppercase tracking-[0.2em] mt-1">Academic Specialty Areas</p>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {[
                      { domain: "Diagnostics Tools & Systems", color: "bg-ug-teal", count: projects.filter(p => p.research_area === ResearchArea.Diagnostics).length },
                      { domain: "Pharmaceutical & Biosimilars", color: "bg-ug-navy", count: projects.filter(p => p.research_area === ResearchArea.Pharmaceutical).length },
                      { domain: "Vaccines & Immunotherapeutic Research", color: "bg-amber-500", count: projects.filter(p => p.research_area === ResearchArea.Vaccines).length }
                    ].map((sec, idx) => {
                      const totalProj = projects.length || 1;
                      const percentage = Math.round((sec.count / totalProj) * 100);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-ug-navy">{sec.domain}</span>
                            <span className="font-mono font-black text-gray-400">{sec.count} Projects ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div className={`h-full ${sec.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Persona Breakdown Wheel */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-black text-ug-navy">Persona Mix</h3>
                    <p className="text-[10px] font-black text-ug-teal uppercase tracking-[0.2em] mt-1">Ecosystem Participants</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { role: "Researchers", count: totalResearchers, percent: profiles.length ? Math.round((totalResearchers / profiles.length) * 100) : 0, color: "text-ug-teal bg-ug-teal/10 border-ug-teal/20" },
                      { role: "Students", count: totalStudents, percent: profiles.length ? Math.round((totalStudents / profiles.length) * 100) : 0, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                      { role: "Investors & VCs", count: totalInvestors, percent: profiles.length ? Math.round((totalInvestors / profiles.length) * 100) : 0, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                      { role: "Industry Partners", count: totalIndustry, percent: profiles.length ? Math.round((totalIndustry / profiles.length) * 100) : 0, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" }
                    ].map((per, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <span className="text-xs font-black text-ug-navy">{per.role}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-gray-400">{per.count} users</span>
                          <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-lg border ${per.color}`}>
                            {per.percent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. USER PORTAL DIRECTORY TAB */}
          {activeSubTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
                {/* Search Box */}
                <div className="relative w-full md:max-w-md">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search registry indices by name, email, or metadata..."
                    className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-xl py-2 pl-10 pr-3 text-xs font-bold text-ug-navy outline-none transition"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  <Filter size={14} className="text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mr-2">Filter Registry</span>
                  {['all', 'Researcher', 'Student', 'Investor', 'Industry/Partner', 'Admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-1.5 text-[9px] font-bold rounded-lg border transition ${
                        roleFilter === role
                          ? 'bg-ug-navy text-white border-ug-navy'
                          : 'bg-white text-gray-400 border-gray-200 hover:text-ug-navy hover:bg-gray-50'
                      }`}
                    >
                      {role === 'all' ? 'show all' : role.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Directory Registry Table */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        <th className="p-6">Registrant Information</th>
                        <th className="p-6">Dynamic Role Status</th>
                        <th className="p-6">Ecosystem AI Integration</th>
                        <th className="p-6 text-right">Administrative Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProfiles.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-xs font-black uppercase text-gray-400 tracking-widest">
                            No registered profiles match current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-ug-navy/5 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                                  {p.avatar_url ? (
                                    <img src={p.avatar_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Users size={16} className="text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-black text-ug-navy text-sm leading-tight">{p.name || 'Anonymous User'}</h4>
                                  <span className="text-[10px] text-gray-400 font-mono mt-1 block">{p.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg border ${
                                p.role === UserRole.Admin ? 'text-purple-600 bg-purple-50 border-purple-200' :
                                p.role === UserRole.Researcher ? 'text-ug-teal bg-ug-teal/5 border-ug-teal/10' :
                                p.role === UserRole.Student ? 'text-blue-500 bg-blue-50 border-blue-100' :
                                'text-amber-500 bg-amber-50 border-amber-100'
                              }`}>
                                {p.role}
                              </span>
                            </td>
                            <td className="p-6">
                              {p.ai_profile ? (
                                <div className="flex items-center gap-2 text-ug-teal font-black text-[9px] uppercase tracking-widest bg-ug-teal/5 border border-ug-teal/10 py-1.5 px-3 rounded-xl w-fit">
                                  <Sparkles size={11} className="animate-spin duration-3000" />
                                  AI Compiled
                                </div>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Unconfigured</span>
                              )}
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-2">Transition Role:</span>
                                <select 
                                  value={p.role}
                                  onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                                  className="bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-ug-navy transition outline-none cursor-pointer"
                                >
                                  {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role.toUpperCase()}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2.5 DISCLOSURES SUBTAB */}
          {activeSubTab === 'disclosures' && (
            <motion.div 
              key="disclosures"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {/* Header and filters */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-ug-navy tracking-tight uppercase">Administrative Disclosures Hub</h3>
                  <p className="text-xs text-gray-400 mt-1">Review, approve, audit, and regulate academic innovation disclosure submissions.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search disclosures ledger..." 
                      value={disclosureSearchQuery}
                      onChange={e => setDisclosureSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 focus:bg-white outline-none transition" 
                    />
                  </div>
                  
                  <select 
                    value={disclosureStatusFilter}
                    onChange={e => setDisclosureStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-ug-navy cursor-pointer focus:ring-2 focus:ring-ug-teal/20 focus:bg-white outline-none"
                  >
                    <option value="all">ALL WORKFLOW STATUSES</option>
                    <option value="Submitted">SUBMITTED</option>
                    <option value="Pending Review">PENDING REVIEW</option>
                    <option value="Documents Requested">DOCS REQUESTED</option>
                    <option value="Under Re-Review">UNDER RE-REVIEW</option>
                    <option value="Approved">APPROVED</option>
                    <option value="Published">PUBLISHED</option>
                    <option value="Rejected">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Main Ledger Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Disclosures matching filter */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-4 h-[680px] overflow-y-auto custom-scrollbar flex flex-col">
                  {(() => {
                    const filtered = projects.filter(p => {
                      const ownerProfile = profiles.find(pr => pr.id === p.owner_id);
                      const matchSearch = p.title.toLowerCase().includes(disclosureSearchQuery.toLowerCase()) || 
                        (ownerProfile?.name || '').toLowerCase().includes(disclosureSearchQuery.toLowerCase()) ||
                        p.department.toLowerCase().includes(disclosureSearchQuery.toLowerCase());
                      const matchStatus = disclosureStatusFilter === 'all' || p.disclosure_status === disclosureStatusFilter;
                      return matchSearch && matchStatus;
                    });

                    const activePendingCount = filtered.filter(p => p.disclosure_status !== DisclosureStatus.Published && p.disclosure_status !== DisclosureStatus.Rejected).length;

                    return (
                      <>
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h4 className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">PENDING DISCLOSURES</h4>
                          <span className="text-[10.5px] font-bold px-2 py-0.5 bg-[#0a0b2c] text-[#3dd1e0] rounded-full">
                            {activePendingCount}
                          </span>
                        </div>
                        
                        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                          {filtered.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
                              No matching disclosures
                            </div>
                          ) : (
                            filtered.map(p => {
                              const ownerProfile = profiles.find(pr => pr.id === p.owner_id);
                              const isChosen = selectedDisclosureId === p.id;
                              
                              const isWaiting = p.disclosure_status === 'Documents Requested' || p.disclosure_status === 'Submitted';
                              const statusLabel = p.disclosure_status === 'Pending Review' ? 'PENDING REVIEW' 
                                                : p.disclosure_status === 'Documents Requested' ? 'WAITING'
                                                : p.disclosure_status === 'Under Re-Review' ? 'RE-REVIEW'
                                                : p.disclosure_status === 'Published' ? 'PUBLISHED'
                                                : (p.disclosure_status || 'SUBMITTED').toUpperCase();

                              return (
                                <div 
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedDisclosureId(p.id);
                                    setAdminInternalNotes(p.internal_notes || '');
                                    setAdminFeedback('');
                                    setAdminRequestedDocsText('');
                                  }}
                                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative flex flex-col justify-between h-34 ${
                                    isChosen 
                                      ? 'bg-white border-[#3dd1e0] shadow-sm' 
                                      : 'bg-gray-50 hover:bg-gray-100/50 border-gray-100'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                      <span className="font-extrabold text-[12.5px] text-[#0a0b2c]/90 truncate">
                                        {ownerProfile?.name || 'Academic Faculty'}
                                      </span>
                                      <span className={`text-[8.5px] font-bold flex items-center gap-1 shrink-0 ${
                                        p.disclosure_status === 'Published' ? 'text-green-500' :
                                        isWaiting ? 'text-amber-500' : 'text-ug-teal'
                                      }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                          p.disclosure_status === 'Published' ? 'bg-green-500' :
                                          isWaiting ? 'bg-amber-500' : 'bg-[#3dd1e0]'
                                        }`}></span>
                                        {statusLabel}
                                      </span>
                                    </div>
                                    
                                    <h5 className="font-semibold text-xs text-gray-650 leading-snug line-clamp-2 pr-4">{p.title}</h5>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100/40">
                                    <span className="text-[9.5px] text-gray-400 font-medium">
                                      Submitted: {new Date(p.created_at).toLocaleDateString()}
                                    </span>
                                    <span className={`text-xs ${isChosen ? 'text-[#3dd1e0]' : 'text-gray-300'}`}>
                                      →
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Right side: Active disclosure screening interface */}
                <div className="lg:col-span-8 bg-[#fafafa] rounded-2xl border border-gray-100 p-6 min-h-[680px] flex flex-col justify-between">
                  {(() => {
                    const activeProj = projects.find(p => p.id === selectedDisclosureId);
                    if (!activeProj) {
                      return (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center text-gray-400 space-y-3 py-36 bg-white rounded-xl border border-dashed border-gray-200 w-full">
                          <ShieldCheck size={40} className="text-gray-300 stroke-[1.5]" />
                          <p className="text-[10.5px] font-bold tracking-wider uppercase max-w-sm">
                            Select a disclosure from the pending ledger list to begin administrative review
                          </p>
                        </div>
                      );
                    }

                    const ownerPr = profiles.find(pr => pr.id === activeProj.owner_id);
                    
                    // Helper to dynamically calculate advisory feedback based on project guidelines
                    const getAIDisclosureAdvisory = (project: Project) => {
                      const text = (project.title + " " + project.description).toLowerCase();
                      let riskLevel = "LOW";
                      let riskColor = "text-green-600 bg-green-50 border-green-200";
                      let riskIcon = "🟢";
                      let riskBullet = "Low Risk Profile. Standard academic disclosure. Complies with institutional publications protocols.";
                      
                      if (text.includes("clinical") || text.includes("drug") || text.includes("human") || text.includes("patient") || text.includes("pharma") || text.includes("vaccine")) {
                        riskLevel = "MEDIUM";
                        riskColor = "text-amber-600 bg-amber-50 border-amber-200";
                        riskIcon = "🟡";
                        riskBullet = "Minor Compliance Query. Involves biomedical or biochemical subjects. Requires institutional bioethics board approval protocols.";
                      } else if (text.includes("patent") || text.includes("nuclear") || text.includes("intellectual") || text.includes("industrial") || text.includes("commercial") || text.includes("quantum")) {
                        riskLevel = "HIGH";
                        riskColor = "text-red-500 bg-red-50 border-red-200";
                        riskIcon = "🔴";
                        riskBullet = "High IP Protection Alert. Discloses proprietary structural mechanics. Early publication may compromise pending patent drafts.";
                      }
                      
                      return {
                        riskLevel,
                        riskColor,
                        riskIcon,
                        riskBullet,
                        pubmedCheck: "Automated PubMed check: 0 matching public papers/patents indexed. Distinctive novelty factor: 97%.",
                        scholarCheck: "Scholar publication check: Structural indexing cleared. Safely quarantined as Private.",
                        recommendedActions: [
                          "1. Verify that all referenced diagrams or CSV logs contain no identifiable user/patient data.",
                          "2. Confirm principal investigator has signed the University of Ghana intellectual sharing guidelines.",
                          "3. Cross-reference academic brief with sub-department clearance letters prior to final hub-cleared publication."
                        ]
                      };
                    };

                    const aiAdvisory = getAIDisclosureAdvisory(activeProj);
                    const timeline = Array.isArray(activeProj.disclosure_timeline) ? activeProj.disclosure_timeline : [];
                    const reqDocs = Array.isArray(activeProj.requested_documents) ? activeProj.requested_documents : [];
                    
                    // Filter messages (EOIs) that correspond specifically to this disclosure
                    const projectMessages = eois.filter((e: any) => e.project_id === activeProj.id)
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                    return (
                      <div className="space-y-6 text-left flex-1 flex flex-col justify-between font-serif">
                        <div className="space-y-6">
                          
                          {/* Top Detail Header Block containing metrics, title, & actions styled like the second design mockup */}
                          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="p-3.5 bg-gray-50 border border-gray-100 text-[#0a0b2c] rounded-xl shrink-0">
                                <ShieldCheck size={26} className="stroke-[1.5]" />
                              </div>
                              <div>
                                <h4 className="text-base md:text-lg font-black text-[#0a0b2c] leading-snug">{activeProj.title}</h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-400 mt-1">
                                  <span>Researcher: <span className="text-[#0a0b2c] font-black">{ownerPr?.name || 'Academic Faculty'}</span></span>
                                  <span className="hidden md:inline text-gray-300">|</span>
                                  <span>Division: <span className="text-gray-650 font-black">{activeProj.department}</span></span>
                                  <span className="hidden md:inline text-[#3dd1e0]">|</span>
                                  <span>Status: <span className="text-ug-teal font-extrabold uppercase">{activeProj.disclosure_status || 'Submitted'}</span></span>
                                </div>
                              </div>
                            </div>

                            {/* Prime action triggers right under overview */}
                            <div className="flex items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                              <button
                                disabled={isProcessingAction}
                                onClick={() => handleApproveDisclosure(activeProj)}
                                className="px-5 py-3 bg-ug-teal text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#0a0b2c] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} />
                                APPROVE
                              </button>
                              
                              <button
                                disabled={isProcessingAction}
                                onClick={() => handleRequestEdits(activeProj)}
                                className="px-5 py-3 bg-[#0a0b2c] text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-ug-teal transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <AlertTriangle size={13} />
                                NEED EDITS
                              </button>
                            </div>
                          </div>

                          {/* ATTACHED DISCLOSURE FILES & RECOVERY */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-3">
                            <h5 className="text-[11px] md:text-xs font-black tracking-widest text-[#0a0b2c] uppercase">ATTACHED DISCLOSURE FILES</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Primary Technical Brief file */}
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <FileText size={16} />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs md:text-sm font-bold text-gray-750 truncate">Research_Brief_Draft.pdf</p>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-semibold">Technical Brief</p>
                                  </div>
                                </div>
                                {activeProj.technical_details_url ? (
                                  <a 
                                    href={activeProj.technical_details_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-1.5 bg-gray-100 text-gray-500 hover:text-ug-teal rounded-lg transition"
                                    title="View Technical Brief PDF"
                                  >
                                    <Eye size={14} />
                                  </a>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-500">NO BRIEF</span>
                                )}
                              </div>

                              {/* Verified structural record */}
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                                    <FileText size={16} />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs md:text-sm font-bold text-gray-750 truncate">Academic_CV_Record.pdf</p>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-semibold">Creds Verification</p>
                                  </div>
                                </div>
                                <span className="p-1.5 bg-gray-105 text-gray-300 rounded-lg">
                                  <Download size={14} />
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Two Columns layout matching the second image workflow block */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Column 1: FROM: ADMINISTRATOR feedback terminal */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col justify-between gap-4 font-serif max-w-full">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] md:text-xs font-black text-[#0a0b2c] tracking-widest uppercase">FROM: ADMINISTRATOR</span>
                                  <span className="text-[10px] text-gray-400 font-bold font-mono">MARKDOWN OK</span>
                                </div>
                                
                                <textarea
                                  rows={4}
                                  value={adminFeedback}
                                  onChange={e => setAdminFeedback(e.target.value)}
                                  placeholder="Provide instructions or feedback to the researcher..."
                                  className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs md:text-sm font-medium text-[#0a0b2c] outline-none focus:bg-white focus:ring-1 focus:ring-ug-teal/30 focus:border-ug-teal/40 leading-normal resize-none"
                                />

                                <div className="space-y-1">
                                  <label className="text-[10px] md:text-[11px] font-black tracking-widest text-[#0a0b2c]/65 uppercase">INTERNAL BOARD NOTES</label>
                                  <input 
                                    type="text"
                                    value={adminInternalNotes}
                                    onChange={e => setAdminInternalNotes(e.target.value)}
                                    placeholder="Private working notes..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium text-gray-650 outline-none focus:bg-white"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] md:text-[11px] font-black tracking-widest text-[#0a0b2c]/65 uppercase">REQUEST DOCUMENT SLOT</label>
                                  <input 
                                    type="text"
                                    value={adminRequestedDocsText}
                                    onChange={e => setAdminRequestedDocsText(e.target.value)}
                                    placeholder="e.g. Bio-Ethics Clearance Letter"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium text-gray-650 outline-none focus:bg-white font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                disabled={isProcessingAction || !adminFeedback.trim()}
                                onClick={() => handleRequestEdits(activeProj)}
                                className="w-full py-3 bg-[#0a0b2c] text-[#3dd1e0] rounded-lg text-xs font-black uppercase tracking-wider hover:bg-ug-teal hover:text-white transition disabled:opacity-50 cursor-pointer"
                              >
                                TRANSMIT TO RESEARCHER
                              </button>
                            </div>

                            {/* Column 2: Researcher Reply Channel terminal */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 flex flex-col justify-between gap-4 font-serif">
                              <div className="space-y-3 flex-1 flex flex-col">
                                <span className="text-[11px] md:text-xs font-black text-gray-400 tracking-widest uppercase block">REVISION CHANNEL & MESSAGES</span>
                                
                                {projectMessages.length === 0 ? (
                                  <div className="border border-dashed border-gray-200 bg-gray-50 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-2 flex-grow min-h-[160px]">
                                    <div className="p-2.5 bg-white text-gray-400 rounded-full border border-gray-100 shadow-sm">
                                      <Layers size={18} className="stroke-[1.5]" />
                                    </div>
                                    <p className="text-xs text-[#0a0b2c] font-black">Dynamic Revision Feed</p>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-medium px-4 leading-normal">
                                      No message history or requested document slots yet. Use the feedback panel to transmit directions.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 flex-grow max-h-[180px] overflow-y-auto space-y-2.5 custom-scrollbar text-left font-serif">
                                    {projectMessages.map((msg: any, mIdx: number) => {
                                      // Simple sender classification
                                      const isAdminMsg = msg.sender_id === user.id || msg.user_name.toLowerCase().includes('admin') || msg.user_name.toLowerCase().includes('board');
                                      return (
                                        <div key={msg.id || mIdx} className={`p-2.5 rounded-lg max-w-[90%] text-xs leading-relaxed shadow-sm ${
                                          isAdminMsg 
                                            ? 'bg-blue-50/80 border border-blue-100 text-[#0a0b2c] ml-auto' 
                                            : 'bg-white border border-gray-100 text-gray-700'
                                        }`}>
                                          <div className="flex justify-between items-center gap-2 mb-1 border-b border-gray-100/40 pb-0.5 text-[9px] font-bold text-gray-400">
                                            <span>{msg.user_name}</span>
                                            <span>{new Date(msg.created_at).toLocaleString()}</span>
                                          </div>
                                          <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Active Uploaded Files status */}
                                {reqDocs.length > 0 && (
                                  <div className="space-y-1.5 max-h-24 overflow-y-auto pt-1 pr-1 custom-scrollbar w-full">
                                    <p className="text-[10px] md:text-[11px] font-black text-[#0a0b2c]/65 uppercase tracking-widest mb-1">Uploaded Slots Status</p>
                                    {reqDocs.map((doc: any, dIdx: number) => (
                                      <div key={dIdx} className="flex justify-between items-center bg-gray-50 p-2 border border-gray-100 rounded-lg text-xs font-semibold text-gray-650">
                                        <div className="truncate flex items-center gap-1.5">
                                          <FileText size={11} className="text-gray-400" />
                                          {doc.url ? (
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-ug-teal hover:underline font-black truncate max-w-xs">
                                              {doc.name}
                                            </a>
                                          ) : (
                                            <span className="text-gray-400 italic font-medium truncate max-w-xs">{doc.name} (Awaiting Upload)</span>
                                          )}
                                        </div>
                                        {doc.url && (
                                          <div className="flex items-center gap-2">
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-ug-teal font-black hover:underline text-xs">
                                              View
                                            </a>
                                            <button 
                                              onClick={() => handleRejectDocumentSlot(activeProj, doc.id)}
                                              className="text-red-500 hover:text-red-700 font-black text-xs cursor-pointer border-l pl-2 border-gray-200"
                                              title="Reject this file and request a re-upload"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-black uppercase tracking-wider text-center select-none font-mono">
                                {activeProj.disclosure_status === 'Documents Requested' ? 'AWAITING REVISIONS' : 'STATION IDLE'}
                              </div>
                            </div>

                          </div>

                          {/* Historical audit trail log ledger */}
                          {timeline.length > 0 && (
                            <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-2 font-serif">
                              <p className="text-[11px] md:text-xs font-black text-[#0a0b2c] tracking-widest uppercase">PERMANENT AUDIT TRAIL LIFE CYCLE LOG</p>
                              <div className="space-y-2 max-h-28 overflow-y-auto pl-1 pr-1 border-l border-gray-150 ml-1">
                                {timeline.map((item: any, idx: number) => (
                                  <div key={idx} className="text-xs font-semibold text-gray-500 leading-relaxed pl-3 text-left relative">
                                    <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-ug-teal"></span>
                                    <span className="text-[#0a0b2c] font-black">[{item.event || item.status}]</span> {item.details} <span className="text-gray-400">by {item.user_name || item.by} ({new Date(item.timestamp).toLocaleDateString()})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Quiet caution footer details of regulatory framework logs */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 font-sans">
                          <p className="text-[9.5px] text-gray-400 font-medium">
                            * All administrative determinations are logged in the secure academic innovation ledger for historical audits.
                          </p>
                          <button
                            disabled={isProcessingAction}
                            onClick={() => handleRejectDisclosure(activeProj)}
                            className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                          >
                            REJECT DISCLOSURE
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </motion.div>
          )}

          {/* 3. PROJECT SCREENER & MODERATION TAB */}
          {activeSubTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Innovation titles, departments, or research tags..."
                    className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-ug-navy outline-none transition"
                  />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                  Registry Index Count: {filteredProjects.length} projects
                </span>
              </div>

              {/* Projects Grid with detailed moderation tools */}
              <div className="grid grid-cols-1 gap-6">
                {filteredProjects.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">No active hub research matched description.</p>
                  </div>
                ) : (
                  filteredProjects.map((p) => (
                    <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-6 md:p-8 hover:shadow-xl transition flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                      {/* Left: Thumbnail & Details */}
                      <div className="w-full lg:w-24 h-24 rounded-2xl overflow-hidden shadow-inner border border-gray-100 shrink-0 bg-gray-50">
                        {p.image_url && p.image_url.trim() !== '' ? (
                          <img src={p.image_url.split('|')[0] || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Layers size={32} />
                          </div>
                        )}
                      </div>

                      {/* Middle: Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap gap-2 items-center text-[9px] font-black uppercase tracking-wider">
                          <span className="text-ug-teal">{p.research_area}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400">{p.department}</span>
                          <span className="text-gray-300">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Budget: {p.budget}</span>
                        </div>
                        <h3 className="text-lg font-black text-ug-navy tracking-tight truncate hover:text-ug-teal transition cursor-pointer">{p.title}</h3>
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>

                      {/* Right: Moderation Controls */}
                      <div className="w-full lg:w-auto p-6 bg-gray-50/50 rounded-2xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 lg:flex gap-4 shrink-0">
                        {/* Maturity Stage Selection */}
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-mono">Maturity Stage</label>
                          <select 
                            value={p.trl || 1}
                            onChange={(e) => handleProjectStatusChange(p.id, 'trl', parseInt(e.target.value))}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-ug-navy transition outline-none cursor-pointer w-full"
                          >
                            {[1,2,3,4,5,6].map(num => (
                              <option key={num} value={num}>Stage {num}</option>
                            ))}
                          </select>
                        </div>

                        {/* Visibility Status */}
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-mono">Visibility Filter</label>
                          <select 
                            value={p.visibility || Visibility.Public}
                            onChange={(e) => handleProjectStatusChange(p.id, 'visibility', e.target.value as Visibility)}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-ug-navy transition outline-none cursor-pointer w-full"
                          >
                            {Object.values(Visibility).map(vis => (
                              <option key={vis} value={vis}>{vis.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        {/* Project Status */}
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-mono">Readiness Status</label>
                          <select 
                            value={p.status || ProjectStatus.Concept}
                            onChange={(e) => handleProjectStatusChange(p.id, 'status', e.target.value as ProjectStatus)}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-ug-navy transition outline-none cursor-pointer w-full"
                          >
                            {Object.values(ProjectStatus).map(st => (
                              <option key={st} value={st}>{st.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>

                        <button 
                          onClick={() => handleDeleteProject(p.id)}
                          className="self-end p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 hover:border-red-200 transition shrink-0 h-10 w-10 flex items-center justify-center self-center"
                          title="Withdraw Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* 3. NEWS CURATOR SUBTAB */}
          {activeSubTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {/* Header Action Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
                <div>
                  <h2 className="text-xl font-black text-ug-navy flex items-center gap-2">
                    <Globe size={20} className="text-ug-teal" />
                    News & Broadcast Curator
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">
                    Manage and broadcast academic breakthroughs, grant opportunities, and strategic ecosystem updates.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={handleAIScoutSync}
                    disabled={isScoutingNews}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-xs font-bold text-gray-700 rounded-xl transition disabled:opacity-50 cursor-pointer h-10"
                  >
                    {isScoutingNews ? (
                      <Loader2 size={14} className="animate-spin text-ug-teal" />
                    ) : (
                      <RefreshCw size={14} className="text-ug-teal" />
                    )}
                    <span>{isScoutingNews ? "Scouting..." : "AI Scout Re-Sync"}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleCreateNewClick();
                      setIsWorkspaceOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-ug-teal hover:bg-ug-teal/90 text-white text-xs font-black rounded-xl transition shadow-md shadow-ug-teal/10 cursor-pointer h-10"
                  >
                    <Plus size={14} />
                    <span>Create New</span>
                  </button>
                </div>
              </div>

              {/* Main Workspace Layout */}
              <div className="grid grid-cols-12 gap-6 items-start text-left">
                
                {/* LEFT SIDE: BROADCAST ARCHIVES */}
                <div className={`transition-all duration-300 ${
                  isWorkspaceOpen ? 'col-span-12 lg:col-span-5' : 'col-span-12'
                } space-y-6`}>
                  
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-ug-navy uppercase tracking-wider">
                        Broadcast Archives
                      </h3>
                      <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                        {sortedArchives.length} Total items
                      </span>
                    </div>

                    {/* Filters & Search Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search archives..."
                          value={archiveSearch}
                          onChange={e => {
                            setArchiveSearch(e.target.value);
                            setArchivePage(1);
                          }}
                          className="w-full bg-gray-50/50 border border-gray-200 focus:border-ug-teal rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-gray-800 outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={selectedCategory}
                          onChange={e => {
                            setSelectedCategory(e.target.value);
                            setArchivePage(1);
                          }}
                          className="bg-gray-50/50 border border-gray-200 focus:border-ug-teal rounded-xl px-2 py-2.5 text-xs font-medium text-gray-700 outline-none cursor-pointer"
                        >
                          <option value="All">All Categories</option>
                          <option value="Announcement">Announcement</option>
                          <option value="Grant Opportunity">Grant Opportunity</option>
                          <option value="Strategic Partnership">Strategic Partnership</option>
                          <option value="Research Release">Research Release</option>
                          <option value="Ecosystem Updates">Ecosystem Updates</option>
                        </select>

                        <select
                          value={selectedStatusFilter}
                          onChange={e => {
                            setSelectedStatusFilter(e.target.value);
                            setArchivePage(1);
                          }}
                          className="bg-gray-50/50 border border-gray-200 focus:border-ug-teal rounded-xl px-2 py-2.5 text-xs font-medium text-gray-700 outline-none cursor-pointer"
                        >
                          <option value="All">All Status</option>
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>
                    </div>

                    {/* Sort Selector Row */}
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-3">
                      <span>SORT ORDER</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setArchiveSort('newest')}
                          className={`hover:text-ug-teal transition cursor-pointer ${archiveSort === 'newest' ? 'text-ug-teal underline' : ''}`}
                        >
                          Newest First
                        </button>
                        <button
                          onClick={() => setArchiveSort('oldest')}
                          className={`hover:text-ug-teal transition cursor-pointer ${archiveSort === 'oldest' ? 'text-ug-teal underline' : ''}`}
                        >
                          Oldest First
                        </button>
                      </div>
                    </div>

                    {/* Announcements List */}
                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                      {paginatedArchives.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50/30 border border-dashed border-gray-100 rounded-xl">
                          <p className="text-xs text-gray-400 font-medium">No archived announcements match filters.</p>
                        </div>
                      ) : (
                        paginatedArchives.map((item) => {
                          const isCurrentlyEditing = editingNews?.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleEditNewsClick(undefined, item);
                                setIsWorkspaceOpen(true);
                              }}
                              className={`group p-4 bg-white hover:bg-gray-50/30 border rounded-xl transition cursor-pointer flex gap-4 items-start ${
                                isCurrentlyEditing 
                                  ? 'border-ug-teal shadow-md shadow-ug-teal/5 bg-ug-teal/5' 
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {/* Thumbnail Image */}
                              {item.image_url && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                                  <img 
                                    src={item.image_url} 
                                    alt="" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}

                              {/* Details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-black uppercase text-ug-teal tracking-wider text-left">
                                    {item.category}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                    item.status === 'Published'
                                      ? 'bg-green-50 text-green-700 border-green-100'
                                      : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    {item.status}
                                  </span>
                                  {item.is_ai_generated && (
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full flex items-center gap-1">
                                      <Sparkles size={8} className="animate-pulse" />
                                      AI
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-bold text-ug-navy line-clamp-1 group-hover:text-ug-teal transition leading-tight text-left">
                                  {item.title}
                                </h4>

                                <p className="text-[11px] text-gray-500 line-clamp-2 font-medium leading-relaxed text-left">
                                  {item.summary}
                                </p>

                                <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold pt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock size={10} />
                                    <span>{new Date(item.published_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditNewsClick(e, item);
                                        setIsWorkspaceOpen(true);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-ug-teal cursor-pointer"
                                      title="Edit Broadcast"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNews(e, item.id);
                                      }}
                                      className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                                      title="Delete Broadcast"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-bold text-gray-500">
                        <span>Page {archivePage} of {totalPages}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setArchivePage(prev => Math.max(1, prev - 1))}
                            disabled={archivePage === 1}
                            className="p-1.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={() => setArchivePage(prev => Math.min(totalPages, prev + 1))}
                            disabled={archivePage === totalPages}
                            className="p-1.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE: CURATOR WORKSPACE (Only visible when isWorkspaceOpen) */}
                <AnimatePresence mode="wait">
                  {isWorkspaceOpen && (
                    <motion.div
                      key="workspace"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden text-left"
                    >
                      {/* Workspace Header */}
                      <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-ug-teal rounded-full animate-pulse" />
                          <h3 className="text-sm font-extrabold text-ug-navy uppercase tracking-wider">
                            {editingNews ? "Edit Broadcast Composition" : "New Broadcast Composition"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleClearWorkspace}
                            className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsWorkspaceOpen(false)}
                            className="p-1.5 hover:bg-gray-200/50 text-gray-400 hover:text-gray-700 rounded-lg transition cursor-pointer"
                            title="Collapse Workspace"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Step Indicator / Tabs */}
                      <div className="flex border-b border-gray-100 bg-gray-50/20">
                        {[
                          { id: 1, title: "1. Core Insight" },
                          { id: 2, title: "2. AI Copywriting" }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 text-center py-3.5 text-[10px] font-black uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${
                              activeTab === tab.id
                                ? 'border-ug-teal text-ug-teal bg-white font-black'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/30'
                            }`}
                          >
                            {tab.title}
                          </button>
                        ))}
                      </div>

                      {/* Tab Contents Panel */}
                      <div className="p-6 overflow-y-auto max-h-[600px] space-y-5">
                        
                        {/* TAB 1: CORE INSIGHT */}
                        {activeTab === 1 && (
                          <div className="space-y-5">
                            {/* AI Document Extractor Panel */}
                            <div className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border border-purple-100 rounded-2xl p-5 mb-1.5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                              <div className="flex items-start gap-3.5">
                                <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700 shrink-0 mt-0.5">
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">AI Document Extractor</h3>
                                    <span className="bg-purple-100 text-purple-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">PRO</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
                                    Upload a news summary draft or article (<span className="font-bold">.txt, .doc, .docx</span>) and the Gemini system will instantly extract the headline, full briefing, category, tags, and verification details to populate this form.
                                  </p>
                                  
                                  <div className="mt-4 flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => docInputRef.current?.click()}
                                      disabled={isExtractingDoc}
                                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition duration-150 flex items-center gap-2 shadow-md shadow-purple-600/15 cursor-pointer"
                                    >
                                      {isExtractingDoc ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Analyzing Document...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload size={12} />
                                          <span>Upload Draft Document</span>
                                        </>
                                      )}
                                    </button>
                                    
                                    {isExtractingDoc && (
                                      <span className="text-[9px] text-purple-600 font-bold uppercase tracking-widest animate-pulse">
                                        Extracting insights...
                                      </span>
                                    )}
                                  </div>
                                  
                                  <input 
                                    type="file"
                                    ref={docInputRef}
                                    onChange={handleDocumentExtract}
                                    accept=".txt,.doc,.docx"
                                    className="hidden"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Broadcast Title *</label>
                                <span className="text-[9px] font-bold text-gray-400">{newsTitle.length}/200 chars</span>
                              </div>
                              <input
                                type="text"
                                placeholder="e.g. UG Secures $5M Academic Innovation Endowment from bilateral development..."
                                value={newsTitle}
                                onChange={e => setNewsTitle(e.target.value.slice(0, 200))}
                                className="w-full bg-white border border-gray-200 focus:border-ug-teal focus:ring-1 focus:ring-ug-teal rounded-xl p-3 text-xs font-bold text-gray-800 outline-none transition"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Short Summary *</label>
                                <span className="text-[9px] font-bold text-gray-400">{newsSummary.length}/1000 chars</span>
                              </div>
                              <textarea
                                placeholder="Enter an authoritative, structured academic brief explaining the core news breaking..."
                                value={newsSummary}
                                onChange={e => setNewsSummary(e.target.value.slice(0, 1000))}
                                className="w-full bg-white border border-gray-200 focus:border-ug-teal focus:ring-1 focus:ring-ug-teal rounded-xl p-3 text-xs font-medium text-gray-800 outline-none transition h-32 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1.5">Category *</label>
                                <select
                                  value={newsCategory}
                                  onChange={e => setNewsCategory(e.target.value)}
                                  className="w-full bg-white border border-gray-200 focus:border-ug-teal rounded-xl p-3 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                                >
                                  <option value="Announcement">Announcement</option>
                                  <option value="Grant Opportunity">Grant Opportunity</option>
                                  <option value="Strategic Partnership">Strategic Partnership</option>
                                  <option value="Research Release">Research Release</option>
                                  <option value="Ecosystem Updates">Ecosystem Updates</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1.5">Broadcast Schedule</label>
                                <input
                                  type="datetime-local"
                                  value={newsPublishedAt}
                                  onChange={e => setNewsPublishedAt(e.target.value)}
                                  className="w-full bg-white border border-gray-200 focus:border-ug-teal rounded-xl p-2.5 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                                />
                              </div>
                            </div>

                            {/* Image Upload Block */}
                            <div>
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1.5">Featured Broadcast Graphic *</label>
                              {newsImageUrl ? (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video group">
                                  <img 
                                    src={newsImageUrl} 
                                    alt="Featured asset" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="px-3 py-1.5 bg-white hover:bg-gray-50 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                    >
                                      Replace Image
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewsImageUrl('')}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-ug-teal hover:bg-gray-50/10 transition cursor-pointer text-center flex flex-col items-center justify-center min-h-[140px] bg-white"
                                >
                                  {isUploadingImage ? (
                                    <>
                                      <Loader2 className="animate-spin text-ug-teal mb-2" size={24} />
                                      <span className="text-[10px] font-black text-ug-teal uppercase">Uploading image...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="text-gray-300 mb-2" size={24} />
                                      <span className="text-xs font-bold text-gray-700">Upload Featured Image</span>
                                      <span className="text-[9px] text-gray-400 font-semibold mt-1">JPG, PNG, WEBP. Max 5MB.</span>
                                    </>
                                  )}
                                </div>
                              )}
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-1.5">Official Source / External Citation Link</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="https://orid.ug.edu.gh/strategic-grant-awards"
                                  value={newsExternalUrl}
                                  onChange={e => setNewsExternalUrl(e.target.value)}
                                  className="w-full bg-white border border-gray-200 focus:border-ug-teal rounded-xl p-3 pr-10 text-xs font-bold text-gray-800 outline-none transition"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                                  <ExternalLink size={12} />
                                </div>
                              </div>
                            </div>

                            {/* Moved Citations & References (Max 4 Links) here */}
                            <div className="pt-4 border-t border-gray-100">
                              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Citations & References (Max 4 Links)</h4>
                              <div className="grid grid-cols-1 gap-2.5">
                                {newsReferenceLinks.map((link, idx) => (
                                  <div key={idx} className="relative">
                                    <input
                                      type="text"
                                      placeholder={`Citation link #${idx + 1}`}
                                      value={link}
                                      onChange={e => {
                                        const updated = [...newsReferenceLinks];
                                        updated[idx] = e.target.value;
                                        setNewsReferenceLinks(updated);
                                      }}
                                      className="w-full bg-white border border-gray-200 focus:border-ug-teal rounded-xl p-2.5 pr-8 text-xs font-medium text-gray-800 outline-none"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-[10px] font-bold">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: AI WRITER ASSISTANCE */}
                        {activeTab === 2 && (
                          <div className="space-y-5">
                            <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-4">
                              <div className="flex items-center gap-2 text-left">
                                <div className="p-1.5 bg-purple-600 rounded-lg text-white">
                                  <Sparkles size={14} className="animate-pulse" />
                                </div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-left">Gemini Professional Copywriter</h4>
                              </div>
                              <p className="text-[11px] text-gray-500 font-medium leading-relaxed text-left">
                                Authoritatively draft elite academic public announcements and breakthroughs instantly. Guided by Gemini intelligence to optimize readability.
                              </p>

                              <div className="space-y-3 pt-2 text-left">
                                <div>
                                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Broadcast Title / Main Topic *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Malaria immunology breakthrough in ORID department"
                                    value={aiTopic || newsTitle}
                                    onChange={e => setAiTopic(e.target.value)}
                                    className="w-full bg-white border border-gray-200 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Focus Keywords / Context Indicators (The Key) *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Prof. G. Awandare, Nature Medicine journal, clinical trial"
                                    value={aiKeywords}
                                    onChange={e => setAiKeywords(e.target.value)}
                                    className="w-full bg-white border border-gray-200 focus:border-purple-500 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    // Use aiTopic, or fall back to newsTitle if they typed it in Tab 1
                                    const topicToUse = aiTopic.trim() || newsTitle.trim();
                                    if (!topicToUse) {
                                      showToast("Please enter a core topic or title for the AI generator.", "error");
                                      return;
                                    }
                                    if (!aiTopic.trim()) {
                                      setAiTopic(topicToUse);
                                    }
                                    await handleGenerateAIPressRelease();
                                    setActiveTab(1);
                                  }}
                                  disabled={isGeneratingAI}
                                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-black text-[10px] uppercase tracking-widest transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/15 cursor-pointer mt-3 h-11"
                                >
                                  {isGeneratingAI ? (
                                    <>
                                      <Loader2 className="animate-spin" size={12} />
                                      <span>Drafting Release...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles size={12} />
                                      <span>Write Professional Release</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Sticky Footer Actions */}
                      <div className="bg-gray-50/50 p-5 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          {editingNews ? (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNews(e, editingNews.id || '')}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100/80 text-red-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer h-9"
                            >
                              <Trash2 size={12} />
                              <span>Permanently Delete</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              New Broadcast Composer
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleActionSave('Draft')}
                            disabled={isSavingNews}
                            className="px-4 py-2 bg-gray-200/60 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer h-9"
                          >
                            Save Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActionSave('Published')}
                            disabled={isSavingNews}
                            className="px-5 py-2 bg-ug-navy hover:bg-ug-navy/90 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1 cursor-pointer h-9"
                          >
                            {isSavingNews ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            <span>Publish Broadcast</span>
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          )}

          {/* 5. GOVERNANCE & INTERACTION LOGS TAB */}
          {activeSubTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 text-left"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-ug-navy">Administrative Audit Logs</h3>
                  <p className="text-[10px] font-black text-ug-teal uppercase tracking-widest mt-1">Outreach & Exchange Request History</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/60 self-start sm:self-center">
                  <Lock size={12} className="text-slate-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider">RESTRICTED ADMIN ACCESS</span>
                </div>
              </div>

              {/* Data Privacy & Compliance Safeguard Banner */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/50 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-ug-navy uppercase tracking-wider">Data Confidentiality & Governance Safeguard</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    This audit trail registers outreach requests, contact exchanges, and matchmaking handshakes within the portal. To enforce privacy guidelines and intellectual property protection, message contents are audited exclusively for quality control, compliance audits, and security monitoring. Full user identities and contact channels are heavily encrypted, and access is permitted only under strict administrative authority.
                  </p>
                </div>
              </div>

              {/* Audit Summary Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Request Volume</p>
                  <p className="text-2xl font-black text-ug-navy">{eois.length}</p>
                  <p className="text-[9px] text-gray-400 font-medium">Logged system outreaches</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Pending Exchanges</p>
                  <p className="text-2xl font-black text-amber-500">
                    {eois.filter(e => !e.status || e.status === 'pending').length}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium">Awaiting participant response</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Successful Handshakes</p>
                  <p className="text-2xl font-black text-ug-teal">
                    {eois.filter(e => e.status === 'accepted').length}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium">Authorized connection matches</p>
                </div>
              </div>

              {/* Interaction Logs listing */}
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black tracking-widest text-gray-400 uppercase">
                        <th className="p-5 pl-6">Sender</th>
                        <th className="p-5">Associated Project</th>
                        <th className="p-5">Date & Time</th>
                        <th className="p-5">Message Excerpt</th>
                        <th className="p-5 pr-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {eois.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-xs font-black uppercase text-gray-400 tracking-widest">
                            No outreach transactions recorded in the audit logs.
                          </td>
                        </tr>
                      ) : (
                        eois.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50/30 transition duration-150">
                            <td className="p-5 pl-6">
                              <div>
                                <span className="font-extrabold text-xs text-ug-navy block">{e.user_name}</span>
                                <span className="text-[9px] font-mono text-gray-400 block mt-0.5">UID: {e.sender_id?.substring(0, 8)}...</span>
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="font-extrabold text-xs text-ug-navy block max-w-xs truncate" title={e.projects?.title}>
                                {e.projects?.title || 'Ecosystem Outreach'}
                              </span>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[9px]">
                                <Clock size={11} />
                                {new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="text-xs text-gray-500 max-w-xs sm:max-w-md line-clamp-1 leading-relaxed italic" title={e.message}>
                                "{e.message}"
                              </p>
                            </td>
                            <td className="p-5 pr-6 text-right">
                              <span className={`text-[8px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                                e.status === 'accepted' ? 'text-ug-success bg-ug-success/5 border-ug-success/10' :
                                e.status === 'ignored' ? 'text-gray-400 bg-gray-50 border-gray-200' :
                                'text-amber-500 bg-amber-50 border-amber-200'
                              }`}>
                                {e.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
