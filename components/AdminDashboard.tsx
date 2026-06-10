import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, FileText, Settings, Bell, ShieldCheck, 
  Trash2, Plus, Edit, RefreshCw, Layers, CheckCircle2, 
  MapPin, Clock, Search, ExternalLink, Filter, HelpCircle, 
  TrendingUp, BarChart3, Radio, FileSpreadsheet, Lock, Sparkles
} from 'lucide-react';
import { User, Project, NewsItem, UserRole, ProjectStatus, Visibility, ResearchArea } from '../types';
import { StorageService } from '../services/storageService';
import { useToast } from '../App';

interface AdminDashboardProps {
  user: User | null;
  onRefresh?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onRefresh }) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'users' | 'projects' | 'news' | 'logs'>('metrics');
  
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

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [allProfiles, allProjects, allNews, allEOIs] = await Promise.all([
        StorageService.adminGetAllProfiles(),
        StorageService.getProjects(),
        StorageService.getNews(),
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
      
      const updatedProject = {
        ...proj,
        [field]: value
      };
      
      await StorageService.saveProject(updatedProject);
      showToast(`Project ${field} updated successfully`, "success");
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, [field]: value } : p));
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

  // Handle saving news item (Insert or Update)
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary) {
      showToast("Please provide a title and summary", "error");
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
        published_at: editingNews?.published_at || new Date().toISOString()
      };

      await StorageService.adminSaveNewsItem(payload);
      showToast(editingNews?.id ? "News item updated" : "News item created successfully", "success");
      
      // Reset state & reload
      setEditingNews(null);
      setNewsTitle('');
      setNewsSummary('');
      setNewsImageUrl('');
      setNewsExternalUrl('');
      loadAdminData();
    } catch (err) {
      showToast("Failed saving hub news", "error");
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleEditNewsClick = (item: NewsItem) => {
    setEditingNews(item);
    setNewsTitle(item.title);
    setNewsCategory(item.category || 'Announcement');
    setNewsSummary(item.summary);
    setNewsImageUrl(item.image_url || '');
    setNewsExternalUrl(item.external_url || '');
  };

  const handleDeleteNews = async (newsId: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await StorageService.adminDeleteNewsItem(newsId);
      showToast("Announcement deleted successfully", "success");
      setNews(prev => prev.filter(n => n.id !== newsId));
    } catch (err) {
      showToast("Failed deleting announcement", "error");
    }
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
    <div className="space-y-10 animate-fade-in text-gray-900">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
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

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-gray-100 pb-px scrollbar-none">
        {[
          { id: 'metrics', label: 'METRICS & ANALYTICS', icon: BarChart3 },
          { id: 'users', label: 'USER DIRECTORY', icon: Users },
          { id: 'projects', label: 'PROJECT SCREENER', icon: FileText },
          { id: 'news', label: 'NEWS CURATOR', icon: Radio },
          { id: 'logs', label: 'GOVERNANCE AUDIT', icon: FileSpreadsheet }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setSearchQuery('');
            }}
            className={`flex items-center gap-3 px-6 py-4 border-b-2 text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'border-ug-teal text-ug-navy font-bold' 
                : 'border-transparent text-gray-400 hover:text-ug-navy'
            }`}
          >
            <tab.icon size={14} className={activeSubTab === tab.id ? 'text-ug-teal' : 'text-gray-400'} />
            {tab.label}
          </button>
        ))}
      </div>

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
              className="space-y-12"
            >
              {/* Core Analytics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Registrants", value: profiles.length, sub: "Verified profiles", trend: "+12%" },
                  { label: "Innovation Index", value: projects.length, sub: "Academic projects", trend: "+8%" },
                  { label: "Mean TRL Level", value: averageTRL, sub: "Scale 1 to 9", trend: "Optimized" },
                  { label: "Interactions Formed", value: totalExpressionsOfInterests, sub: "Active collaborations", trend: "High Volume" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-36">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                    <div>
                      <h3 className="text-3xl font-extrabold text-ug-navy leading-none tracking-tight">{stat.value}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">{stat.sub}</span>
                        <span className="text-[8px] font-bold uppercase text-ug-teal bg-ug-teal/5 px-2 py-0.5 rounded-full">{stat.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stakeholders Persona Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-ug-navy">Sector Hub Activity</h3>
                    <p className="text-[10px] font-black text-ug-teal uppercase tracking-[0.2em] mt-1">Academic Specialty Areas</p>
                  </div>
                  
                  <div className="space-y-5 mt-8">
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
                          <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div className={`h-full ${sec.color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Persona Breakdown Wheel */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-ug-navy">Persona Mix</h3>
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
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-gray-100">
                {/* Search Box */}
                <div className="relative w-full md:max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search registry indices by name, email, or metadata..."
                    className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-ug-navy outline-none transition"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <Filter size={14} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-2">Filter Registry</span>
                  {['all', 'Researcher', 'Student', 'Investor', 'Industry/Partner', 'Admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-4 py-2 text-[9px] font-black rounded-xl border transition ${
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
                        {p.image_url ? (
                          <img src={p.image_url.split('|')[0]} className="w-full h-full object-cover" alt="" />
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
                        {/* TRL Slider/Audit */}
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block font-mono">TRL Audit</label>
                          <select 
                            value={p.trl || 1}
                            onChange={(e) => handleProjectStatusChange(p.id, 'trl', parseInt(e.target.value))}
                            className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-ug-navy transition outline-none cursor-pointer w-full"
                          >
                            {[1,2,3,4,5,6,7,8,9].map(num => (
                              <option key={num} value={num}>TRL {num}</option>
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

          {/* 4. GLOBAL ANNOUNCEMENT NEWS CURATOR */}
          {activeSubTab === 'news' && (
            <motion.div 
              key="news"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Create or Edit News */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6 h-fit sticky top-24">
                <div>
                  <h3 className="text-xl font-black text-ug-navy tracking-tight">
                    {editingNews ? "Edit Announcement" : "Create Announcement"}
                  </h3>
                  <p className="text-[10px] font-black text-ug-teal uppercase tracking-widest mt-1">Broadcast directly to News Portal</p>
                </div>

                <form onSubmit={handleSaveNews} className="space-y-5 text-left">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Title</label>
                    <input 
                      type="text" 
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      placeholder="E.g., UG secures 5M USD Innovation Grant"
                      className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl p-4 text-xs font-bold text-ug-navy outline-none transition"
                      required
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Short Summary</label>
                    <textarea 
                      value={newsSummary}
                      onChange={(e) => setNewsSummary(e.target.value)}
                      placeholder="Write brief descriptive copy outlining the announcement details..."
                      rows={4}
                      className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl p-4 text-xs font-bold text-ug-navy outline-none transition resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={newsCategory}
                      onChange={(e) => setNewsCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-xs font-bold text-ug-navy outline-none cursor-pointer"
                    >
                      {['Announcement', 'Grant Opportunity', 'Strategic Partnership', 'Research Release', 'Ecosystem Updates'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newsImageUrl}
                      onChange={(e) => setNewsImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl p-4 text-xs font-bold text-ug-navy outline-none transition"
                    />
                  </div>

                  {/* External Link */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">External PDF / Link (Optional)</label>
                    <input 
                      type="url" 
                      value={newsExternalUrl}
                      onChange={(e) => setNewsExternalUrl(e.target.value)}
                      placeholder="https://orid.ug.edu.gh/resource-file"
                      className="w-full bg-gray-50 border border-transparent focus:border-ug-teal focus:bg-white rounded-2xl p-4 text-xs font-bold text-ug-navy outline-none transition"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
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
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl py-4 font-black text-[9px] uppercase tracking-widest transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingNews}
                      className="flex-1 bg-ug-navy hover:bg-ug-teal text-white rounded-2xl py-4 font-black text-[9px] uppercase tracking-widest shadow-xl shadow-ug-navy/10 transition disabled:opacity-50"
                    >
                      {isSavingNews ? 'Saving...' : (editingNews ? 'Save Changes' : 'Broadcast News')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: News History Feed List */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-ug-navy">Broadcast Archives</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Curation registry and control lists</p>
                </div>

                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between hover:shadow-lg transition">
                      <div className="flex gap-4 items-center min-w-0">
                        {item.image_url && (
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                            <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 text-[8px] font-black uppercase tracking-wider text-ug-teal">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span className="text-gray-400">{new Date(item.published_at).toLocaleDateString()}</span>
                            {item.is_ai_generated && (
                              <>
                                <span>•</span>
                                <span className="bg-purple-50 text-purple-600 border border-purple-100 px-1.5 rounded">AI SCOUT</span>
                              </>
                            )}
                          </div>
                          <h4 className="font-black text-xs text-ug-navy leading-snug line-clamp-1">{item.title}</h4>
                          <p className="text-[11px] text-gray-400 font-medium line-clamp-1 leading-normal mt-0.5">{item.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleEditNewsClick(item)}
                          className="p-2.5 bg-gray-50 hover:bg-gray-100 hover:text-ug-teal text-gray-400 rounded-xl transition border border-gray-100"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
              className="space-y-6 text-left"
            >
              <div>
                <h3 className="text-xl font-black text-ug-navy">Governance & Exchange Audit Trail</h3>
                <p className="text-[10px] font-black text-ug-teal uppercase tracking-widest mt-1">Symmetric Match-Making Disks Activity Record</p>
              </div>

              {/* Interaction Logs listing */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        <th className="p-6">Origin Host (Sender)</th>
                        <th className="p-6">Associated Project Asset</th>
                        <th className="p-6">Transmission Date</th>
                        <th className="p-6">Communication Message Payload</th>
                        <th className="p-6 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {eois.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-xs font-black uppercase text-gray-400 tracking-widest">
                            No hub transactions recorded in the audit trail.
                          </td>
                        </tr>
                      ) : (
                        eois.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-6">
                              <div>
                                <span className="font-black text-xs text-ug-navy">{e.user_name}</span>
                                <span className="text-[9px] font-mono text-gray-400 block mt-0.5">UID: {e.sender_id?.substring(0, 8)}...</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-extrabold text-xs text-ug-navy block max-w-xs truncate" title={e.projects?.title}>
                                {e.projects?.title || 'Ecosystem Outreach (No Project Specified)'}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[10px]">
                                <Clock size={12} />
                                {new Date(e.created_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="p-6">
                              <p className="text-xs text-gray-500 max-w-sm line-clamp-2 leading-relaxed" title={e.message}>
                                {e.message}
                              </p>
                            </td>
                            <td className="p-6 text-right">
                              <span className={`text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border ${
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
