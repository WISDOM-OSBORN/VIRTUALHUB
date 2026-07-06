import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Tag, 
  ChevronRight, 
  Newspaper, 
  Sparkles, 
  Loader2, 
  ExternalLink, 
  Globe, 
  Zap, 
  RefreshCw, 
  Microscope, 
  Clock, 
  Search, 
  Filter, 
  Link2,
  Edit,
  Trash2,
  Upload,
  X,
  LayoutDashboard,
  FileText,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorageService } from '../services/storageService';
import { AIScoutService } from '../services/aiScoutService';
import { NewsItem } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../App';
import { getGeminiResponse } from '../services/geminiService';

const News: React.FC = () => {
  const { showToast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Administrative / Curation states
  const [isAdmin, setIsAdmin] = useState(false);
  const [curatorMode, setCuratorMode] = useState(false);

  // News editing / creation form states
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Announcement');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsExternalUrl, setNewsExternalUrl] = useState('');
  const [newsStatus, setNewsStatus] = useState<'Draft' | 'Published'>('Published');
  const [newsReferenceLinks, setNewsReferenceLinks] = useState<string[]>(['', '', '', '']);
  const [newsTags, setNewsTags] = useState('');
  const [newsRelevanceScore, setNewsRelevanceScore] = useState<number>(0);
  const [newsSourceVerificationNotes, setNewsSourceVerificationNotes] = useState('');

  // UI state managers
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIWriteModal, setShowAIWriteModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');

  const formatNewsDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], { dateStyle: 'medium' });
    } catch (e) {
      return dateStr;
    }
  };

  // Debounce search term input changes before querying
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset page back to 1 on new search term
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset page number on category changes to start viewing from the beginning
  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

  const fetchNews = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const adminStatus = await StorageService.verifyAdmin();
      setIsAdmin(adminStatus);

      const limit = 20;
      const data = await StorageService.getNews(adminStatus, {
        page: pageNum,
        limit,
        search: debouncedSearchTerm,
        category: selectedCategory
      });

      if (append) {
        setNews(prev => {
          // Avoid duplicate items by checking IDs
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNewData = data.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewData];
        });
      } else {
        setNews(data);
      }

      setHasMore(data.length === limit);

      const syncTime = await AIScoutService.getLastSyncTime();
      setLastSync(syncTime);
    } catch (err) {
      console.error("Error loading news feed:", err);
      showToast("Could not load news discovery feed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger paginated data loading reactively when search term, category, or page index changes
  useEffect(() => {
    fetchNews(page, page > 1);
  }, [debouncedSearchTerm, selectedCategory, page]);

  // Handle seamless background sync on mount if list is empty or news is stale (>2 hours)
  useEffect(() => {
    const handleBackgroundSync = async () => {
      try {
        const syncTime = await AIScoutService.getLastSyncTime();
        const isStale = !syncTime || (new Date().getTime() - syncTime.getTime() > 2 * 60 * 60 * 1000);
        
        // Check database count or content
        const adminStatus = await StorageService.verifyAdmin();
        const checkData = await StorageService.getNews(adminStatus, { page: 1, limit: 1 });
        
        if (checkData.length === 0 || isStale) {
          console.log("Discovery Feed: Initiating seamless background news sync...");
          const didSync = await AIScoutService.autoSyncNews(false);
          if (didSync) {
            setPage(1);
            fetchNews(1, false);
          }
        }
      } catch (err) {
        console.warn("Background auto-sync gracefully bypassed:", err);
      }
    };
    handleBackgroundSync();
  }, []);

  const handleNewsClick = (item: NewsItem) => {
    if (item.external_url) {
      if (item.external_url.startsWith('#')) {
        window.location.hash = item.external_url;
      } else {
        window.open(item.external_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Fallback for broken images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1532187875605-1ef638272ee4?auto=format&fit=crop&w=800&q=80';
  };

  // Handle saving news item (Insert or Update)
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary) {
      showToast("Please provide a title and summary", "error");
      return;
    }

    // MANDATORY IMAGE VALIDATION BEFORE PUBLISHING
    if (newsStatus === 'Published' && (!newsImageUrl || newsImageUrl.trim() === '')) {
      showToast("An image is required before publishing. Please upload a JPG, PNG, or WEBP image first.", "error");
      return;
    }

    try {
      setIsSavingNews(true);
      const payload: Partial<NewsItem> = {
        id: editingNews?.id,
        title: newsTitle,
        category: newsCategory,
        summary: newsSummary,
        image_url: newsImageUrl,
        external_url: newsExternalUrl,
        published_at: editingNews?.published_at || new Date().toISOString(),
        status: newsStatus,
        reference_links: newsReferenceLinks.map(link => link.trim()),
        tags: newsTags.split(',').map(t => t.trim()).filter(Boolean),
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
      setNewsRelevanceScore(0);
      setNewsSourceVerificationNotes('');
      
      if (page === 1) {
        fetchNews(1, false);
      } else {
        setPage(1);
      }
    } catch (err) {
      showToast("Failed saving hub news", "error");
    } finally {
      setIsSavingNews(false);
    }
  };

  // Pre-populate news item for editing
  const handleEditNewsClick = (e: React.MouseEvent, item: NewsItem) => {
    e.stopPropagation(); // Avoid triggering standard card opening/external link click
    setEditingNews(item);
    setNewsTitle(item.title);
    setNewsCategory(item.category || 'Announcement');
    setNewsSummary(item.summary);
    setNewsImageUrl(item.image_url || '');
    setNewsExternalUrl(item.external_url || '');
    setNewsStatus(item.status || 'Published');
    setNewsReferenceLinks(item.reference_links && item.reference_links.length > 0 ? [...item.reference_links, '', '', '', ''].slice(0, 4) : ['', '', '', '']);
    setNewsTags(item.tags ? item.tags.join(', ') : '');
    setNewsRelevanceScore(item.relevance_score || 0);
    setNewsSourceVerificationNotes(item.source_verification_notes || '');
    
    // Scroll to curation workspace smoothly
    const element = document.getElementById("news-curator-workspace-anchor");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Delete news item
  const handleDeleteNews = async (e: React.MouseEvent, newsId: string) => {
    e.stopPropagation(); // Avoid triggering standard card opening
    if (!window.confirm("Are you sure you want to permanently delete this announcement? This action is irreversible.")) return;
    try {
      await StorageService.adminDeleteNewsItem(newsId);
      showToast("Announcement deleted successfully", "success");
      setNews(prev => prev.filter(n => n.id !== newsId));
      if (editingNews?.id === newsId) {
        // Clear editor if the deleted item was currently loaded
        setEditingNews(null);
        setNewsTitle('');
        setNewsSummary('');
        setNewsImageUrl('');
        setNewsExternalUrl('');
        setNewsStatus('Published');
        setNewsReferenceLinks(['', '', '', '']);
        setNewsTags('');
        setNewsRelevanceScore(0);
        setNewsSourceVerificationNotes('');
      }
    } catch (err) {
      showToast("Failed deleting announcement", "error");
    }
  };

  // Image Upload handler with manual validation (JPG, PNG, WEBP, 5MB max size)
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
      const url = await StorageService.uploadFile(file, 'projects');
      setNewsImageUrl(url);
      showToast("Image uploaded successfully!", "success");
    } catch (err: any) {
      showToast(`Upload failed: ${err.message || err}`, "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Write announcement draft with Gemini assistance
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

  // Since the database handles filtering, pagination, and full-text search, we utilize the news array directly
  const filteredNews = news;

  return (
    <div className="min-h-screen bg-white py-16">
      <div id="news-curator-workspace-anchor" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 border-b border-gray-100 pb-12 gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-ug-navy rounded-[2rem] text-white shadow-2xl">
                 <Microscope size={32} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-ug-navy tracking-tighter">Discovery Feed</h1>
                <p className="text-ug-teal font-black text-[10px] uppercase tracking-[0.5em] mt-1">University of Ghana Innovation Watch</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium text-lg max-w-2xl leading-relaxed">
              Monitoring global and local breakthroughs in vaccines, drug discoveries, and diagnostics.
            </p>
            {lastSync && (
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Clock size={14} className="text-ug-teal" />
                Last Automated Sync: {lastSync.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setCuratorMode(!curatorMode)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shrink-0 border ${
                curatorMode 
                  ? 'bg-ug-teal border-teal-500 text-white ring-4 ring-ug-teal/10 animate-pulse' 
                  : 'bg-ug-navy border-ug-navy text-white hover:bg-ug-teal hover:border-ug-teal'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>{curatorMode ? "Close Curator Workspace" : "Open Curator Workspace"}</span>
            </button>
          )}
        </div>

        {/* Dynamic Curation Session Workspace (Only accessible if verified Admin) */}
        <AnimatePresence>
          {isAdmin && curatorMode && (
            <motion.div
              id="news-curator-workspace"
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 48 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-[#0a0b25] text-white p-8 md:p-12 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-ug-teal/10 rounded-full blur-3xl -z-10" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800/60 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-ug-teal/20 text-ug-teal border border-ug-teal/30 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse">
                        Active Curator Session
                      </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mt-2 text-white">
                      {editingNews ? "Modify Previous Broadcast" : "Compose New Announcement"}
                    </h2>
                    <p className="text-gray-400 font-medium text-xs mt-1">
                      Directly edit, delete or broadcast items to the University of Ghana Innovation Watch registry.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAIWriteModal(!showAIWriteModal)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-600/15 border border-purple-500/20"
                    >
                      <Sparkles size={13} className="animate-pulse" />
                      {showAIWriteModal ? "Custom Composing" : "Draft with Gemini"}
                    </button>
                    {editingNews && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNews(null);
                          setNewsTitle('');
                          setNewsCategory('Announcement');
                          setNewsSummary('');
                          setNewsImageUrl('');
                          setNewsExternalUrl('');
                          setNewsStatus('Published');
                          setNewsReferenceLinks(['', '', '', '']);
                        }}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </div>

                {showAIWriteModal ? (
                  <div className="max-w-3xl space-y-5 text-left">
                    <h3 className="text-lg font-black text-purple-400 flex items-center gap-2">
                      <Sparkles size={16} /> Write announcement draft with Gemini
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Enter the primary scientific topic or announcement details below. Our Gemini integration will formulate a professionally structured news summary.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Core Topic / Headline Concept</label>
                        <input 
                          type="text" 
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="E.g., University of Ghana Malarial vaccine trial dataset release"
                          className="w-full bg-gray-900/60 border border-gray-800 focus:border-purple-500 rounded-xl p-4 text-xs font-bold text-white outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Context Keywords (Optional)</label>
                        <input 
                          type="text" 
                          value={aiKeywords}
                          onChange={(e) => setAiKeywords(e.target.value)}
                          placeholder="E.g., WHO, malaria, clinical trials, Accra"
                          className="w-full bg-gray-900/60 border border-gray-800 focus:border-purple-500 rounded-xl p-4 text-xs font-bold text-white outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAIWriteModal(false)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-6 py-3.5 font-black text-[9px] uppercase tracking-widest transition"
                      >
                        Back to Custom Form
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAIPressRelease}
                        disabled={isGeneratingAI || !aiTopic}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 py-3.5 font-black text-[9px] uppercase tracking-widest shadow-xl shadow-purple-600/20 transition disabled:opacity-50"
                      >
                        {isGeneratingAI ? "AI Composing..." : "Generate AI Draft"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveNews} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                    {/* Left & Middle Column Fields */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Announcement Title</label>
                        <input
                          type="text"
                          required
                          value={newsTitle}
                          onChange={(e) => setNewsTitle(e.target.value)}
                          placeholder="Enter a compelling headline"
                          className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Summary & Briefing Content</label>
                        <textarea
                          rows={5}
                          required
                          value={newsSummary}
                          onChange={(e) => setNewsSummary(e.target.value)}
                          placeholder="Detailed announcement context..."
                          className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Type</label>
                          <select
                            value={newsCategory}
                            onChange={(e) => setNewsCategory(e.target.value)}
                            className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition cursor-pointer appearance-none"
                          >
                            <option value="Announcement" className="bg-[#0c0e35]">Announcement</option>
                            <option value="Grant Opportunity" className="bg-[#0c0e35]">Grant Opportunity</option>
                            <option value="Strategic Partnership" className="bg-[#0c0e35]">Strategic Partnership</option>
                            <option value="Research Release" className="bg-[#0c0e35]">Research Release</option>
                            <option value="Ecosystem Updates" className="bg-[#0c0e35]">Ecosystem Updates</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Broadcast Status</label>
                          <select
                            value={newsStatus}
                            onChange={(e) => setNewsStatus(e.target.value as 'Draft' | 'Published')}
                            className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition cursor-pointer appearance-none"
                          >
                            <option value="Published" className="bg-[#0c0e35]">Published (Visible immediately)</option>
                            <option value="Draft" className="bg-[#0c0e35]">Draft (Internal Archive)</option>
                          </select>
                        </div>
                      </div>

                      {/* AI Scout Intelligence Insights Metadata Fields */}
                      <div className="space-y-4 border-t border-gray-800/60 pt-5">
                        <h4 className="text-[10px] font-black text-ug-teal uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Radio size={12} className="text-ug-teal shrink-0 animate-pulse" /> AI Scout Intelligence Insights
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tags / Research Topics (Comma-separated)</label>
                            <input
                              type="text"
                              value={newsTags}
                              onChange={(e) => setNewsTags(e.target.value)}
                              placeholder="E.g., Diagnostics, Malaria, Genetics, Clinical Trials"
                              className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Relevance Score (1-100)</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={newsRelevanceScore || ''}
                              onChange={(e) => setNewsRelevanceScore(parseInt(e.target.value) || 0)}
                              placeholder="95"
                              className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Source Verification & Credibility Notes</label>
                          <textarea
                            rows={3}
                            value={newsSourceVerificationNotes}
                            onChange={(e) => setNewsSourceVerificationNotes(e.target.value)}
                            placeholder="Add verification background, journal review status, or peer citation notes..."
                            className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-4 text-xs font-bold text-white outline-none transition resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column Fields */}
                    <div className="space-y-6">
                      {/* Manual Image Upload with Validation and Preview */}
                      <div className="space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-800">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                          Featured Visual Asset <span className="text-red-500 font-black">* REQUIRED FOR PUBLISHING</span>
                        </label>
                        
                        {newsImageUrl ? (
                          <div className="space-y-3">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-900 group">
                              <img 
                                src={newsImageUrl} 
                                className="w-full h-full object-cover" 
                                alt="News featured asset" 
                                onError={handleImageError}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-2">
                                <label className="cursor-pointer bg-white text-ug-navy hover:bg-gray-100 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md">
                                  <Upload size={12} /> Replace
                                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setNewsImageUrl('')}
                                  className="bg-red-600 text-white hover:bg-red-700 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md"
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">
                                {newsImageUrl.startsWith('data:') ? 'Local file uploaded' : 'Uploaded Image'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setNewsImageUrl('')}
                                className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 tracking-wider flex items-center gap-1"
                              >
                                Remove Image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-800 hover:border-ug-teal/50 bg-gray-900/40 hover:bg-gray-900/60 rounded-xl py-6 px-4 cursor-pointer transition text-center min-h-[140px]">
                            {isUploadingImage ? (
                              <div className="space-y-2 flex flex-col items-center">
                                <Loader2 size={24} className="animate-spin text-ug-teal" />
                                <span className="text-[10px] font-bold text-gray-400">Uploading to cloud storage...</span>
                              </div>
                            ) : (
                              <div className="space-y-1 flex flex-col items-center">
                                <Upload size={24} className="text-gray-500" />
                                <span className="text-xs font-black text-gray-200">Upload Featured Image</span>
                                <span className="text-[9px] font-medium text-gray-500">JPG, PNG or WEBP. Max 5MB.</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/jpeg,image/jpg,image/png,image/webp" 
                              onChange={handleImageUpload} 
                              className="hidden" 
                              disabled={isUploadingImage} 
                            />
                          </label>
                        )}
                        {newsStatus === 'Published' && !newsImageUrl && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                            ⚠️ An image must be uploaded before this item can be published.
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Direct External URL (Optional)</label>
                        <input
                          type="text"
                          value={newsExternalUrl}
                          onChange={(e) => setNewsExternalUrl(e.target.value)}
                          placeholder="https://ug.edu.gh/news/..."
                          className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl p-3.5 text-xs font-bold text-white outline-none transition"
                        />
                      </div>

                      {/* Reference Links Collection */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic / Media References (Max 4)</label>
                        <div className="space-y-2">
                          {newsReferenceLinks.map((link, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={link}
                              onChange={(e) => {
                                const copy = [...newsReferenceLinks];
                                copy[idx] = e.target.value;
                                setNewsReferenceLinks(copy);
                              }}
                              placeholder={`Reference Link #${idx + 1}`}
                              className="w-full bg-gray-900/60 border border-gray-800 focus:border-ug-teal rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none transition"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Form Actions */}
                      <button
                        type="submit"
                        disabled={isSavingNews}
                        className="w-full bg-ug-teal hover:bg-teal-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition shadow-lg shadow-ug-teal/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSavingNews ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Saving Announcement...</span>
                          </>
                        ) : (
                          <span>{editingNews ? "Apply Modifications" : "Broadcast Announcement"}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Category Filters */}
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search news..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ug-teal focus:border-transparent transition-all font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-full md:w-64">
             <select 
                className="appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-6 pr-12 rounded-2xl font-black text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-ug-teal transition-all cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
             >
                <option value="All">All Categories</option>
                <option value="Announcement">Announcement</option>
                <option value="Grant Opportunity">Grant Opportunity</option>
                <option value="Strategic Partnership">Strategic Partnership</option>
                <option value="Research Release">Research Release</option>
                <option value="Ecosystem Updates">Ecosystem Updates</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <Filter size={18} />
             </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
           <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-ug-teal mb-6" size={56} />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em]">Aggregating Intelligence...</p>
           </div>
        )}

        {/* News Grid */}
        <div className="grid lg:grid-cols-1 gap-12">
          {filteredNews.length === 0 && !loading && (
            <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem]">
               <Globe className="text-gray-200 mx-auto mb-8" size={80} />
               <h3 className="text-2xl font-black text-ug-navy">No news items matched</h3>
               <p className="text-gray-400 font-medium mt-3 text-lg">Try clearing your filters or refining your search words.</p>
            </div>
          )}

          {filteredNews.map((item, idx) => (
            <article 
              key={item.id} 
              onClick={() => handleNewsClick(item)}
              className="group bg-gray-50/30 rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row border border-gray-100 hover:bg-white hover:shadow-2xl hover:border-ug-teal/10 transition-all duration-700 cursor-pointer animate-fade-in-up relative"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="md:w-[400px] h-80 md:h-auto overflow-hidden relative shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 grayscale-[20%] group-hover:grayscale-0" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ug-navy/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-10">
                   <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ug-teal mb-2">Original Context Available</p>
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-lg">Access Full Briefing</span>
                         <ExternalLink size={20} />
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-12 md:p-16 flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-sm ${item.is_ai_generated ? 'bg-ug-teal text-white' : 'bg-ug-navy text-white'}`}>
                    {item.is_ai_generated ? <Zap size={14} className="fill-white" /> : <Tag size={14} />} 
                    {item.category}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Calendar size={18} /> {formatNewsDate(item.published_at)}
                  </span>
                  {item.source_name && (
                    <span className="flex items-center gap-2 text-[10px] font-black text-ug-navy uppercase tracking-[0.2em] bg-white px-6 py-2.5 rounded-full border border-gray-100 shadow-sm">
                       <Globe size={18} className="text-ug-teal" /> {item.source_name}
                    </span>
                  )}
                  {item.status === 'Draft' && (
                    <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                      Draft
                    </span>
                  )}
                </div>
                
                <h2 className="text-4xl font-black text-ug-navy mb-8 leading-[1.1] group-hover:text-ug-teal transition-colors tracking-tight max-w-3xl">
                  {item.title}
                </h2>
                
                <p className="text-gray-500 font-medium text-xl leading-relaxed mb-10 line-clamp-3 max-w-4xl whitespace-pre-line">
                  {item.summary}
                </p>
                
                {item.reference_links && Array.isArray(item.reference_links) && item.reference_links.filter(Boolean).length > 0 && (
                  <div className="mb-8" onClick={e => e.stopPropagation()}>
                    <h4 className="text-[10px] font-black uppercase text-ug-navy tracking-widest mb-3">Reference Links:</h4>
                    <div className="flex flex-wrap gap-3">
                      {item.reference_links.filter(Boolean).slice(0, 4).map((link, lIdx) => (
                        <a 
                          key={lIdx}
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-100 hover:bg-ug-teal hover:text-white rounded-xl text-xs font-bold text-gray-600 transition-all flex items-center gap-2 border border-gray-200/50"
                        >
                          <Link2 size={12} />
                          <span>Link {lIdx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-10 border-t border-gray-100/60 pt-6">
                  <div className="flex items-center gap-4 text-ug-navy font-black text-sm uppercase tracking-widest group-hover:text-ug-teal transition-all group-hover:translate-x-4">
                    Explore Full Discovery <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </div>

                  {isAdmin && curatorMode && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleEditNewsClick(e, item)}
                        className="px-5 py-2.5 bg-gray-50 hover:bg-ug-teal hover:text-white text-gray-600 hover:border-ug-teal rounded-xl transition font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-gray-200 cursor-pointer"
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteNews(e, item.id)}
                        className="px-5 py-2.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 hover:border-red-600 rounded-xl transition font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-100 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Paginated Feed Control */}
        {hasMore && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="px-8 py-4 bg-white border-2 border-ug-navy hover:bg-ug-navy hover:text-white text-ug-navy rounded-3xl font-black text-xs uppercase tracking-widest transition duration-300 shadow-md hover:shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-ug-teal" size={16} />
                  <span>Loading Discoveries...</span>
                </>
              ) : (
                <>
                  <span>Load More Discoveries</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
        <div className="mt-32 text-center">
           <div className="inline-flex items-center gap-4 px-10 py-4 bg-gray-50 rounded-full border border-gray-100">
              <Sparkles size={18} className="text-ug-teal" /> 
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">
                 Autonomous Research Scout Operational
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default News;
