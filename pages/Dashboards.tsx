
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, ProjectStatus, Visibility, Project, ResearchArea, User } from '../types';
import { StorageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Plus, FileText, 
  Settings, Bell, ShieldCheck, Download, 
  ChevronRight, Globe, Lock, X, Check, Award, GraduationCap, Eye, Search, Loader2, Star, Trash, Inbox, Archive, MoreVertical, CornerUpLeft, Paperclip, Maximize2, Minimize2, ChevronLeft,
  Briefcase, BookOpen, Handshake, Image as ImageIcon, Upload, DollarSign, FileCode,
  Home as HomeIcon,
  ShoppingBag, Bookmark, ArrowRight, User as UserIcon, Link as LinkIcon, Camera, AlertCircle, Info,
  Pencil, Trash2, FileUp, MessageSquare, MailOpen, Clock, Zap, Send as SendIcon, Calendar, File, LayoutGrid, Target, Sparkles, LogOut
} from 'lucide-react';
import { useToast } from '../App';

interface DashboardProps {
  role: UserRole;
  user: User | null;
}

// --- MOBILE BOTTOM NAV ---
const MobileNav: React.FC<{ activeTab: string; setActiveTab: (t: any) => void; role: UserRole; unreadCount: number }> = ({ activeTab, setActiveTab, role, unreadCount }) => {
  const tabs = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'matches', icon: Target, label: role === UserRole.Student ? 'Discover' : 'Matches' },
    { id: 'messages', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: UserIcon, label: 'Me' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-[100] flex items-center justify-around pb-safe pt-2 px-2 h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 h-full transition-all duration-300 relative ${
            activeTab === tab.id ? 'text-ug-teal' : 'text-gray-400'
          }`}
        >
          <div className={`p-2 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-ug-teal/10 scale-110' : 'bg-transparent'}`}>
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          </div>
          {tab.id === 'messages' && unreadCount > 0 && (
             <span className="absolute top-2 right-1/2 translate-x-4 w-5 h-5 bg-ug-teal text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
               {unreadCount > 9 ? '9+' : unreadCount}
             </span>
          )}
          <span className={`text-[9px] font-black tracking-tight uppercase ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div 
              layoutId="mobile-indicator"
              className="absolute -bottom-1 h-1 w-6 bg-ug-teal rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  );
};

// --- DESKTOP SIDEBAR ---
const Sidebar: React.FC<{ activeTab: string; setActiveTab: (t: any) => void; role: UserRole; user: User | null }> = ({ activeTab, setActiveTab, role, user }) => {
  const tabs = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'matches', icon: Target, label: 'My Matches', hideFor: [UserRole.Student], sparkles: true },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ].filter(t => !t.hideFor || !t.hideFor.includes(role));

  return (
    <div className="hidden md:flex w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 flex-col p-6 z-[80]">
      <div className="mb-12 px-4 flex items-center gap-3">
        <div className="bg-ug-navy p-2 rounded-xl text-white">
          <GraduationCap size={20} />
        </div>
        <h2 className="text-sm font-black text-ug-navy uppercase tracking-widest leading-none">
          RESEARCHER<br/><span className="text-ug-teal">PORTAL</span>
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${
              activeTab === tab.id 
                ? 'bg-ug-navy text-white shadow-xl shadow-ug-navy/20 active-nav' 
                : 'text-gray-400 hover:bg-gray-50 hover:text-ug-navy'
            }`}
          >
            <div className="flex items-center gap-3">
              <tab.icon size={18} />
              <span className="text-xs font-black tracking-widest uppercase">{tab.label}</span>
            </div>
            {tab.sparkles && <Sparkles size={12} className={activeTab === tab.id ? 'text-ug-teal' : 'text-gray-300 opacity-0 group-hover:opacity-100 transition'} />}
          </button>
        ))}
      </nav>
    </div>
  );
};

// --- SHARED COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string | number; trend?: string; icon: any; color?: string }> = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all h-28 md:h-32 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
      <Icon size={14} className="text-gray-200 group-hover:text-ug-teal transition duration-500 md:w-4 md:h-4" />
    </div>
    <div className="flex items-baseline gap-2 md:gap-3">
      <h3 className="text-2xl md:text-3xl font-black text-ug-navy tracking-tight">{value}</h3>
      {trend && (
        <span className="text-[7px] md:text-[8px] font-black text-ug-teal bg-ug-teal/5 px-2 py-0.5 rounded-full tracking-widest leading-none">
          {trend}
        </span>
      )}
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-black text-ug-navy flex items-center gap-2">
      <div className="h-6 w-1 bg-ug-teal rounded-full"></div> {title}
    </h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1 font-medium ml-3">{subtitle}</p>}
  </div>
);

// --- HUB STREAM COMPONENT (SIDEBAR) ---
const HubStreamSidebar: React.FC = () => {
  const [trending, setTrending] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    StorageService.getTrendingProjects().then(data => {
      setTrending(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-full bg-gray-100 rounded-xl"></div>
      <div className="h-40 w-full bg-gray-50 rounded-2xl"></div>
      <div className="h-40 w-full bg-gray-50 rounded-2xl"></div>
    </div>
  );

  return (
    <aside className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sticky top-24">
       <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-black text-ug-navy">Hub Stream</h3>
            <p className="text-[10px] font-black text-ug-teal uppercase tracking-[0.2em] mt-1">Trending Innovations</p>
          </div>
          <div className="h-10 w-10 bg-ug-navy text-white rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
             <Zap size={18} className="text-ug-teal" />
          </div>
       </div>

       <div className="space-y-6">
          {trending.map(p => (
            <div 
              key={p.id} 
              onClick={() => navigate(`/projects/${p.id}`)}
              className="group bg-gray-50/50 border border-transparent rounded-[2rem] p-5 hover:bg-white hover:border-ug-teal/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
               <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-white">
                     <img src={p.image_url.split('|')[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black text-ug-teal uppercase tracking-widest">{p.research_area}</span>
                        <div className="h-1 w-1 bg-gray-200 rounded-full"></div>
                        <span className="text-[8px] font-black text-ug-success uppercase tracking-widest">{p.status}</span>
                     </div>
                     <h4 className="font-black text-ug-navy text-xs leading-tight line-clamp-2 group-hover:text-ug-teal transition">{p.title}</h4>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-gray-400 tracking-widest">
                     <Users size={10} /> Active Engagement
                  </div>
                  <div className="text-ug-navy group-hover:translate-x-1 transition-transform">
                     <ArrowRight size={14} />
                  </div>
               </div>
            </div>
          ))}
       </div>
    </aside>
  );
};

// --- PROJECT DISCLOSURE MODAL ---
const ProjectFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  project: Project | null;
}> = ({ isOpen, onClose, onSave, project }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // File states
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [evidenceImage, setEvidenceImage] = useState<File | null>(null);
  const [technicalBrief, setTechnicalBrief] = useState<File | null>(null);

  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    department: '',
    status: ProjectStatus.Concept,
    visibility: Visibility.Public,
    trl: 1,
    research_area: ResearchArea.Diagnostics,
    image_url: '',
    budget: '',
    start_date: new Date().toISOString().split('T')[0],
    funding_amount_usd: '',
    open_to_collaboration: true,
    technical_details_url: '',
    achievements: [],
    needs: []
  });

  useEffect(() => {
    if (project) {
      setFormData(project);
    } else {
      setFormData({
        title: '',
        description: '',
        department: '',
        status: ProjectStatus.Concept,
        visibility: Visibility.Public,
        trl: 1,
        research_area: ResearchArea.Diagnostics,
        image_url: '',
        budget: '',
        start_date: new Date().toISOString().split('T')[0],
        funding_amount_usd: '',
        open_to_collaboration: true,
        technical_details_url: '',
        achievements: [],
        needs: []
      });
    }
    setMainImage(null);
    setEvidenceImage(null);
    setTechnicalBrief(null);
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url || '';
      let finalBriefUrl = formData.technical_details_url || '';

      // Upload files if selected
      if (mainImage) {
        const url = await StorageService.uploadFile(mainImage, 'projects');
        finalImageUrl = url;
      }

      if (evidenceImage) {
        const url = await StorageService.uploadFile(evidenceImage, 'projects');
        finalImageUrl = finalImageUrl ? `${finalImageUrl}|${url}` : url;
      }

      if (technicalBrief) {
        const url = await StorageService.uploadFile(technicalBrief, 'projects');
        finalBriefUrl = url;
      }

      const updatedPayload = {
        ...formData,
        image_url: finalImageUrl,
        technical_details_url: finalBriefUrl
      };

      await StorageService.saveProject(updatedPayload);
      showToast(project ? "Disclosure Updated" : "Project Successfully Disclosed", "success");
      onSave();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to save disclosure", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 md:p-10 bg-ug-navy/95 backdrop-blur-md overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-[3rem] md:rounded-[4rem] w-full max-w-5xl p-6 md:p-12 shadow-2xl relative my-8">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-ug-teal text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileCode size={24} />
             </div>
             <div>
               <h2 className="text-2xl md:text-3xl font-black text-ug-navy tracking-tight">{project ? 'Update Disclosure' : 'New Project Disclosure'}</h2>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">University of Ghana Research Intelligence</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition hover:rotate-90 duration-300"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-11 gap-12">
          {/* Left Column: Core Identity */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-1 bg-ug-teal rounded-full"></div>
                  <span className="text-[10px] font-black text-ug-navy uppercase tracking-widest">Identification</span>
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Research Title / Product Name</label>
                 <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none transition" placeholder="Enter formal project title..." />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Research Area</label>
                   <select value={formData.research_area} onChange={e => setFormData({...formData, research_area: e.target.value as ResearchArea})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none cursor-pointer">
                     {Object.values(ResearchArea).map(area => <option key={area} value={area}>{area}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                   <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" placeholder="e.g. Computer Science" />
                 </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-1 bg-ug-teal rounded-full"></div>
                  <span className="text-[10px] font-black text-ug-navy uppercase tracking-widest">Content & Maturity</span>
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Executive Summary</label>
                 <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-medium text-gray-600 focus:ring-2 focus:ring-ug-teal/20 outline-none resize-none leading-relaxed" placeholder="Describe your research methodology and potential impact..." />
               </div>

               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                 <select 
                   value={formData.status} 
                   onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus, trl: Object.values(ProjectStatus).indexOf(e.target.value as ProjectStatus) + 1})}
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none cursor-pointer"
                 >
                   {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-1 bg-ug-teal rounded-full"></div>
                  <span className="text-[10px] font-black text-ug-navy uppercase tracking-widest">Visual Evidence</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-[2.5rem] cursor-pointer bg-gray-50 hover:bg-white hover:border-ug-teal/30 transition group overflow-hidden">
                    {mainImage ? (
                       <div className="w-full h-full p-2">
                          <img src={URL.createObjectURL(mainImage)} className="w-full h-full object-cover rounded-[2rem]" alt="" />
                       </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition duration-500">
                        <Camera size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Primary Image</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setMainImage(e.target.files?.[0] || null)} />
                  </label>

                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-100 rounded-[2.5rem] cursor-pointer bg-gray-50 hover:bg-white hover:border-ug-teal/30 transition group overflow-hidden">
                    {evidenceImage ? (
                       <div className="w-full h-full p-2">
                          <img src={URL.createObjectURL(evidenceImage)} className="w-full h-full object-cover rounded-[2rem]" alt="" />
                       </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition duration-500">
                        <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Secondary Proof</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setEvidenceImage(e.target.files?.[0] || null)} />
                  </label>
               </div>
            </div>
          </div>

          {/* Right Column: Technical & Logistics */}
          <div className="lg:col-span-5 space-y-8 bg-gray-50/50 p-6 md:p-8 rounded-[3rem] border border-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-4 w-1 bg-ug-teal rounded-full"></div>
                 <span className="text-[10px] font-black text-ug-navy uppercase tracking-widest">Logistics & Funding</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Budget Estimate</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" placeholder="$0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Key Achievements & Milestones</label>
                <textarea rows={3} value={formData.achievements?.join('\n')} onChange={e => setFormData({...formData, achievements: e.target.value.split('\n').filter(s => s.trim())})} className="w-full bg-white border border-gray-100 rounded-2xl p-4 font-medium text-gray-600 focus:ring-2 focus:ring-ug-teal/20 outline-none resize-none text-xs" placeholder="• Lab validation completed&#10;• Prototype developed&#10;• Clinical testing phase..." />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Technical Briefing (PDF/DOC)</label>
                 <label className="flex items-center gap-4 w-full p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:shadow-xl transition group">
                    <div className="p-3 bg-ug-navy text-ug-teal rounded-xl shadow-lg group-hover:scale-110 transition">
                      <FileUp size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-ug-navy truncate">
                         {technicalBrief ? technicalBrief.name : 'Upload Document'}
                      </p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Formal Disclosure Brief</p>
                    </div>
                    <input type="file" className="hidden" onChange={e => setTechnicalBrief(e.target.files?.[0] || null)} />
                 </label>
              </div>

              <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="collab" className="text-[10px] font-black text-ug-navy uppercase tracking-widest cursor-pointer">Open to Collaboration</label>
                  <div className="relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer">
                    <input 
                      type="checkbox" id="collab" 
                      checked={formData.open_to_collaboration} 
                      onChange={e => setFormData({...formData, open_to_collaboration: e.target.checked})} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ug-teal"></div>
                  </div>
                </div>
                <p className="text-[8px] font-medium text-gray-400 leading-normal">Enabling this makes your research discoverable to verified industry partners and technical investors.</p>
              </div>

              <div className="pt-6 space-y-4">
                <button type="submit" disabled={loading} className="w-full bg-ug-navy text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.25em] shadow-xl hover:bg-ug-teal active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (project ? <ShieldCheck size={18} /> : <Check size={18} />)}
                  {project ? 'Apply Disclosure Changes' : 'Finalize Disclosure'}
                </button>
                <button type="button" onClick={onClose} className="w-full py-4 text-gray-400 font-black uppercase text-[9px] tracking-widest hover:text-red-500 transition-colors">
                  Discard Draft
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MESSAGES SECTION (GMAIL STYLE) ---
const MessagesSection: React.FC<{ user: User | null; initialThreadId?: string | null }> = ({ user, initialThreadId }) => {
  const [threads, setThreads] = useState<any[][]>([]);
  const [selectedThread, setSelectedThread] = useState<any[] | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'inbox' | 'sent' | 'starred' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [recipientResults, setRecipientResults] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (selectedThread) {
      setIsMobileListOpen(false);
    } else {
      setIsMobileListOpen(true);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (user?.id) {
      StorageService.getConversations(user.id).then(data => {
        setThreads(data);
        if (initialThreadId && initialThreadId !== 'all') {
          const thread = data.find(t => t[0].project_id === initialThreadId);
          if (thread) setSelectedThread(thread);
        }
      });
    }
  }, [user?.id, initialThreadId]);

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedThread || !user) return;
    setSending(true);
    try {
      const firstMsg = selectedThread[0];
      const recipientId = firstMsg.sender_id === user.id ? firstMsg.recipient_id : firstMsg.sender_id;
      
      await StorageService.submitEOI(firstMsg.project_id, user.name, reply, recipientId);
      setReply('');
      showToast("Message Sent", "success");
      const updated = await StorageService.getConversations(user.id);
      setThreads(updated);
      const newThread = updated.find(t => t[0].project_id === firstMsg.project_id && (t[0].sender_id === recipientId || t[0].recipient_id === recipientId));
      if (newThread) setSelectedThread(newThread);
    } catch (e) {
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleSelectThread = async (thread: any[]) => {
    setSelectedThread(thread);
    if (user?.id) {
      const lastMsg = thread[0];
      const partnerId = lastMsg.sender_id === user.id ? lastMsg.recipient_id : lastMsg.sender_id;
      await StorageService.markAsRead(user.id, lastMsg.project_id, partnerId);
      // Refresh threads to update unread status in UI
      const updated = await StorageService.getConversations(user.id);
      setThreads(updated);
    }
  };

  const filteredThreads = threads.filter(thread => {
    const lastMsg = thread[0];
    const isSent = lastMsg.sender_id === user?.id;
    
    // Category filtering
    if (activeCategory === 'inbox' && isSent) return false;
    if (activeCategory === 'sent' && !isSent) return false;
    // (Starred and Trash would need DB support, for now we just show empty or filtered)
    if (activeCategory === 'starred') return false; 
    if (activeCategory === 'trash') return false;

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lastMsg.user_name.toLowerCase().includes(query) ||
        lastMsg.message.toLowerCase().includes(query) ||
        (lastMsg.projects?.title || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unreadCount = threads.filter(t => t.some(m => !m.read && m.recipient_id === user?.id)).length;

  const handleRecipientSearch = async (query: string) => {
    setComposeRecipient(query);
    if (query.length > 1) {
      const results = await StorageService.searchUsers(query);
      setRecipientResults(results.filter(u => u.id !== user?.id));
    } else {
      setRecipientResults([]);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!selectedRecipient || !composeMessage.trim() || !user) return;
    setSending(true);
    try {
      await StorageService.submitEOI(null, user.name, composeMessage, selectedRecipient.id);
      showToast("Direct Message Transmitted", "success");
      setIsComposing(false);
      setComposeMessage('');
      setComposeRecipient('');
      setSelectedRecipient(null);
      const updated = await StorageService.getConversations(user.id);
      setThreads(updated);
    } catch (e) {
      showToast("Failed to transmit message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white md:rounded-[2rem] border-x md:border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-180px)] md:h-[750px] flex animate-fade-in font-sans relative">
      {/* Gmail Sidebar (Hidden on Mobile unless list open) */}
      <div className={`w-full md:w-64 border-r border-gray-100 flex-col bg-white pt-4 absolute inset-0 z-20 md:relative md:flex transition-transform duration-300 ${isMobileListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-4 mb-4">
          <button 
            onClick={() => setIsComposing(true)}
            className="flex items-center gap-4 bg-white hover:shadow-lg transition-all px-6 py-3 md:py-4 rounded-2xl text-sm font-bold text-gray-700 border border-gray-100 w-full shadow-sm"
          >
            <Pencil size={20} className="text-ug-teal" />
            <span className="tracking-wide">Compose</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 md:px-0">
          {[
            { id: 'inbox', icon: Inbox, label: 'Inbox', count: unreadCount },
            { id: 'starred', icon: Star, label: 'Starred' },
            { id: 'sent', icon: SendIcon, label: 'Sent' },
            { id: 'trash', icon: Trash, label: 'Trash' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                setSelectedThread(null);
              }}
              className={`w-full md:w-[95%] flex items-center justify-between px-6 py-3 md:py-2.5 rounded-2xl md:rounded-r-full text-sm transition-all mb-1 ${
                activeCategory === cat.id 
                  ? 'bg-blue-50 text-blue-700 font-black' 
                  : 'text-gray-600 hover:bg-gray-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-4">
                <cat.icon size={18} className={activeCategory === cat.id ? 'text-blue-700' : 'text-gray-500'} />
                {cat.label}
              </div>
              {cat.count ? (
                <span className={`text-xs ${activeCategory === cat.id ? 'font-black' : 'font-bold'}`}>
                  {cat.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white z-10 transition-transform duration-300 ${!isMobileListOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {/* Search Bar & Actions (Only if list open) */}
        {isMobileListOpen || !selectedThread ? (
          <div className="h-16 border-b border-gray-100 flex items-center px-4 gap-4 bg-white">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><Archive size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><Trash size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><MoreVertical size={18} /></button>
            </div>
          </div>
        ) : null}

        {selectedThread ? (
          /* Message Detail View */
          <div className="flex-1 flex flex-col bg-white overflow-hidden absolute inset-0 md:relative">
            <div className="h-14 border-b border-gray-50 flex items-center px-4 gap-4 bg-white shrink-0">
              <button 
                onClick={() => setSelectedThread(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate text-sm md:text-base">
                  {selectedThread[0].projects?.title || 'General Inquiry'}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{selectedThread[0].user_name}</p>
              </div>
              <button className="md:hidden p-2 text-gray-400"><Trash size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar bg-gray-50/20">
              {[...selectedThread].reverse().map((msg, i) => (
                <div key={i} className="group animate-fade-in">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-full bg-ug-navy/5 flex items-center justify-center text-ug-navy shrink-0 shadow-sm">
                      <UserIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{msg.user_name}</span>
                          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">&lt;{msg.sender_id.substring(0, 8)}...&gt;</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap p-3 md:p-0 bg-white md:bg-transparent rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
                        {msg.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Area */}
            <div className="p-4 md:p-6 border-t border-gray-100 bg-white">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <textarea 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full p-4 text-xs md:text-sm focus:outline-none resize-none min-h-[80px] md:min-h-[100px]"
                />
                <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-1 md:gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition"><Paperclip size={18} /></button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition"><ImageIcon size={18} /></button>
                  </div>
                  <button 
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <><SendIcon size={16} /> Send</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Thread List View */
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10 md:p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <MailOpen size={40} className="opacity-20" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest">No messages found</p>
                <p className="text-xs mt-2 text-gray-400">Your conversations in {activeCategory} will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredThreads.map((thread, i) => {
                  const lastMsg = thread[0];
                  const isUnread = !lastMsg.read && lastMsg.recipient_id === user?.id;
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleSelectThread(thread)}
                      className={`flex items-center px-4 py-4 md:py-3 gap-3 md:gap-4 cursor-pointer hover:bg-gray-50/50 transition-all relative ${
                        isUnread ? 'bg-blue-50/30' : 'bg-white'
                      }`}
                    >
                      {isUnread && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full ml-1 animate-pulse"></div>}
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="w-4 h-4 border border-gray-300 rounded sm group-hover:border-gray-400 transition-colors"></div>
                        <button className="text-gray-300 hover:text-yellow-400 transition"><Star size={18} /></button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate w-32 md:w-48 ${isUnread ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                            {lastMsg.user_name}
                          </span>
                          <span className={`text-[10px] shrink-0 font-bold uppercase tracking-tighter ${isUnread ? 'text-blue-600' : 'text-gray-400'}`}>
                            {new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                           <span className={`text-xs truncate shrink-0 ${isUnread ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                            {lastMsg.projects?.title || 'General Inquiry'}
                          </span>
                          <span className="text-gray-400 text-xs shrink-0">•</span>
                          <span className="text-gray-500 text-xs truncate opacity-70">
                            {lastMsg.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose Modal (Gmail Style) - Responsive Width */}
      {isComposing && (
        <div className="fixed inset-0 md:inset-auto md:bottom-0 md:right-10 md:w-[500px] md:h-[600px] bg-white shadow-2xl md:rounded-t-2xl border border-gray-200 z-[200] flex flex-col animate-slide-up">
          <div className="bg-ug-navy text-white px-4 py-4 md:py-3 md:rounded-t-2xl flex items-center justify-between shrink-0">
            <span className="text-sm font-black uppercase tracking-widest text-ug-teal">New Interaction</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsComposing(false)} className="p-1 hover:bg-white/10 rounded transition hidden md:block"><Minimize2 size={16} /></button>
              <button onClick={() => setIsComposing(false)} className="p-1 hover:bg-white/10 rounded transition md:hidden"><X size={20} /></button>
              <button onClick={() => setIsComposing(false)} className="p-1 hover:bg-white/10 rounded transition hidden md:block"><X size={16} /></button>
            </div>
          </div>
          <div className="p-4 md:p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for collaborators..." 
                value={selectedRecipient ? selectedRecipient.name : composeRecipient}
                onChange={(e) => handleRecipientSearch(e.target.value)}
                disabled={!!selectedRecipient}
                className="w-full border-b border-gray-100 py-2 text-sm focus:outline-none" 
              />
              {selectedRecipient && (
                <button 
                  onClick={() => setSelectedRecipient(null)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
              {recipientResults.length > 0 && !selectedRecipient && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-xl mt-1 z-20 overflow-hidden">
                  {recipientResults.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => {
                        setSelectedRecipient(u);
                        setRecipientResults([]);
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-ug-teal/10 flex items-center justify-center text-ug-teal text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{u.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input 
              type="text" 
              placeholder="Subject" 
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full border-b border-gray-100 py-2 text-sm focus:outline-none" 
            />
            <textarea 
              placeholder="Message" 
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value)}
              className="w-full min-h-[300px] py-2 text-sm focus:outline-none resize-none" 
            />
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button 
              onClick={handleSendDirectMessage}
              disabled={sending || !selectedRecipient || !composeMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <Paperclip size={18} className="cursor-pointer hover:text-gray-600" />
              <ImageIcon size={18} className="cursor-pointer hover:text-gray-600" />
              <Trash size={18} className="cursor-pointer hover:text-gray-600 ml-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- DASHBOARD WRAPPER ---
interface DashboardsProps extends DashboardProps {
  initialThreadId?: string | null;
  onThreadHandled?: () => void;
  onLogout?: () => void;
}

const Dashboards: React.FC<DashboardsProps> = ({ role, user, initialThreadId, onThreadHandled, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'messages' | 'profile'>('overview');
  const [localUser, setLocalUser] = useState<User | null>(user);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (initialThreadId) {
      setActiveTab('messages');
      if (onThreadHandled) onThreadHandled();
    }
  }, [initialThreadId, onThreadHandled]);

  useEffect(() => {
    setLocalUser(user);
    if (user?.id) {
       StorageService.getUnreadCount(user.id).then(setInternalUnread);
    }
  }, [user]);

  const [internalUnread, setInternalUnread] = useState(0);

  const refreshProfile = async () => {
    if (!user?.id) return;
    const freshProfile = await StorageService.getProfile(user.id);
    setLocalUser(freshProfile);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback if prop not provided
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar role={role} user={localUser} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="bg-ug-navy text-white flex items-center justify-between px-8 py-5 shrink-0 md:ml-64 shadow-2xl z-50">
          <nav className="hidden lg:flex items-center gap-10 ml-8">
             {['Home', 'Projects', 'Products', 'News'].map(link => (
               <button 
                 key={link} 
                 onClick={() => navigate(link === 'Home' ? '/' : `/${link.toLowerCase()}`)}
                 className="text-[10px] font-black uppercase tracking-[0.25em] hover:text-ug-teal transition-all cursor-pointer opacity-80 hover:opacity-100"
               >
                 {link}
               </button>
             ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-6 mr-4 sm:mr-8">
            <button 
              onClick={() => setActiveTab('messages')}
              className={`p-2 transition-all relative group rounded-xl hover:bg-white/10 ${activeTab === 'messages' ? 'text-ug-teal' : 'text-white/70 hover:text-white'}`}
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-ug-teal rounded-full border-2 border-ug-navy"></span>
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-gray-900 text-[7px] font-black uppercase rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                Messages
              </span>
            </button>

            {/* Mobile Home Icon - Only show on mobile */}
            <button 
              onClick={() => navigate('/')}
              className="sm:hidden p-2 text-white/70 hover:text-white transition-all group relative rounded-xl hover:bg-white/10"
            >
              <HomeIcon size={20} />
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-gray-900 text-[7px] font-black uppercase rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                Home
              </span>
            </button>
            
            <div className="flex items-center gap-4 pl-4 sm:pl-6 border-l border-white/10">
              <button 
                onClick={() => setActiveTab('profile')}
                className="hidden sm:flex w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/20 items-center justify-center text-[10px] font-black overflow-hidden shadow-inner group cursor-pointer hover:ring-ug-teal/50 transition relative"
              >
                {localUser?.avatar_url ? (
                  <img src={localUser.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <UserIcon size={16} className="text-white/50 group-hover:text-ug-teal transition" />
                )}
              </button>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-white/50 hover:text-red-400 transition-all group relative rounded-xl hover:bg-white/5"
              >
                <LogOut size={20} />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-gray-900 text-[7px] font-black uppercase rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 md:ml-64 overflow-y-auto w-full bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto w-full p-4 md:p-10 pb-32 md:pb-12 space-y-8 md:space-y-12">
          {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-8 md:space-y-12">
              {role === UserRole.Researcher && (
                <ResearcherDashboard 
                  user={localUser} 
                  onUpdate={refreshProfile} 
                  onOpenModal={(proj) => {
                    setSelectedProject(proj);
                    setIsProjectModalOpen(true);
                  }}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {role === UserRole.Student && <StudentDashboard user={localUser} />}
              {(role === UserRole.Partner || role === UserRole.Industry) && <PartnerDashboard user={localUser} />}
            </div>
          )}

          {activeTab === 'matches' && (
             <MatchesView user={localUser} />
          )}

          {activeTab === 'messages' && <MessagesSection user={localUser} initialThreadId={initialThreadId} />}
          {activeTab === 'profile' && <ProfileSettings user={localUser} onUpdate={refreshProfile} />}
        </div>
      </main>

      <MobileNav role={role} activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={internalUnread} />
    </div>

    {isProjectModalOpen && (
      <ProjectFormModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onSave={() => setRefreshTrigger(prev => prev + 1)} 
        project={selectedProject} 
      />
    )}
  </div>
);
};

// --- SUB-DASHBOARDS ---

const ResearcherDashboard = ({ user, onUpdate, onOpenModal, refreshTrigger }: { user: User | null; onUpdate: () => void; onOpenModal: (p: Project | null) => void; refreshTrigger: number }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const pList = await StorageService.getMyProjects(user.id);
      setProjects(pList);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user?.id, refreshTrigger]);

  const activeProject = projects[0]; // For visual demonstration of hero card

  const totalViews = projects.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalInteractions = projects.reduce((acc, p) => acc + (p.expressions_of_interest || 0) + (p.requests || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <UnifiedDashboardProfile user={user} onAction={() => {
           onOpenModal(null);
        }} actionLabel="New Project Disclosure" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Live Disclosures" value={projects.length} trend="+2" icon={FileText} />
          <StatCard label="Total Hub Views" value={totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}k` : totalViews} trend="+8%" icon={Eye} />
          <StatCard label="Interactions" value={totalInteractions} trend="+12%" icon={Handshake} />
        </div>

        {activeProject && (
          <ActiveProjectHero project={activeProject} />
        )}

        <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <SectionTitle title="Core Assets" subtitle="Secure Research Record Management" />
          </div>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="py-10 md:py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest px-4">No assets disclosed yet.</p>
              </div>
            ) : projects.slice(0, 3).map(p => (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="group flex items-center justify-between p-4 md:p-5 border border-gray-50 rounded-2xl bg-gray-50/30 hover:bg-white hover:border-ug-teal/30 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-sm bg-gray-100">
                    <img src={p.image_url.split('|')[0]} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h4 className="font-black text-ug-navy text-[11px] md:text-xs group-hover:text-ug-teal transition line-clamp-1">{p.title}</h4>
                    <span className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-wider">{p.research_area}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenModal(p);
                    }}
                    className="p-1 md:p-2 text-gray-400 hover:text-ug-teal transition"
                   >
                     <Pencil size={12} className="md:w-3.5 md:h-3.5" />
                   </button>
                   <ChevronRight size={14} className="text-gray-300 md:w-4 md:h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <HubStreamSidebar />
        {user?.id && <BookmarkedProjectsList userId={user.id} />}
      </div>
    </div>
  );
};

const UnifiedDashboardProfile = ({ user, onAction, actionLabel }: { user: User | null, onAction: () => void, actionLabel: string }) => (
  <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-ug-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition duration-1000"></div>
    
    <div className="relative">
      <div className="w-28 h-28 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-ug-navy">
        {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-full h-full p-6 text-white/20" />}
      </div>
      <div className="absolute -bottom-1 -right-1 bg-ug-teal p-1.5 rounded-full border-4 border-white text-white shadow-lg">
        <ShieldCheck size={14} />
      </div>
    </div>

    <div className="flex-1 text-center md:text-left">
      <h2 className="text-3xl font-black text-ug-navy tracking-tight mb-1">{user?.name}</h2>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">{user?.role} • {user?.department || 'University of Ghana'}</p>
      <div className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-xl border border-gray-100 mx-auto md:mx-0">
        <Plus size={10} className="text-ug-teal" />
        <span className="text-[8px] font-black text-ug-navy uppercase tracking-widest">Identity Verified</span>
      </div>
    </div>

    <button 
      onClick={onAction}
      className="bg-ug-navy text-white px-8 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-ug-teal transition-all flex items-center gap-3 active:scale-95"
    >
      <Plus size={18} /> {actionLabel}
    </button>
  </div>
);

const StatCardV2 = ({ label, value, trend, icon: Icon }: any) => null;
const RedesignedResearcherProfile = ({ user, onDisclosure }: { user: User | null, onDisclosure: () => void }) => null;

const ActiveProjectHero = ({ project }: { project: Project }) => (
  <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden animate-fade-in group">
    <div className="relative h-64 overflow-hidden">
      <img src={project.image_url.split('|')[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-ug-navy via-ug-navy/40 to-transparent"></div>
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-ug-teal text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse w-fit">
          ACTIVE PROJECT
        </div>
        <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{project.title}</h3>
      </div>
    </div>

        <div className="p-6 md:p-10 space-y-8 md:space-y-10">
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
          <span className="text-[10px] md:text-xs font-black text-ug-teal uppercase tracking-widest">{project.status}</span>
        </div>
        
        <div className="relative pt-2">
          {/* Track */}
          <div className="h-1.5 w-full bg-gray-100 rounded-full flex justify-between px-0.5 items-center">
            {Object.values(ProjectStatus).map((s, idx) => (
              <div 
                key={s} 
                className={`h-2.5 w-0.5 rounded-full ${s === project.status ? 'bg-ug-teal' : 'bg-gray-300'}`}
              ></div>
            ))}
          </div>
          {/* Progress Overlay */}
          <div className="absolute top-2 left-0 h-1.5 bg-ug-teal rounded-full transition-all duration-700" style={{ width: `${(Object.values(ProjectStatus).indexOf(project.status)) / (Object.values(ProjectStatus).length - 1) * 100}%` }}></div>
          {/* Thumb */}
          <div className="absolute top-[3px] -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 bg-white border-[3px] md:border-4 border-ug-teal rounded-full shadow-lg transition-all duration-700" style={{ left: `calc(${(Object.values(ProjectStatus).indexOf(project.status)) / (Object.values(ProjectStatus).length - 1) * 100}% - 10px)` }}></div>

          <div className="flex justify-between mt-4 overflow-hidden">
             {Object.values(ProjectStatus).map((s, i) => (
               <span key={s} className={`text-[7px] md:text-[8px] font-black ${s === project.status ? 'text-ug-teal' : 'text-gray-300'} max-w-[40px] truncate`}>{s}</span>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 pt-8 border-t border-gray-50 font-sans">
        <div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Collaborators</span>
          <div className="flex items-center -space-x-3">
             {['AS', 'JM', 'EV'].map((initials, i) => (
               <div key={i} className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[10px] font-black text-ug-navy text-xs shadow-sm ring-2 ring-white">
                 {initials}
               </div>
             ))}
             <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm">+3</div>
          </div>
        </div>
        <div>
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Next Milestone</span>
           <p className="text-xs font-black text-ug-navy leading-none">Clinical Pilot (Sept 24)</p>
           <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Awaiting Ethics Approval</p>
        </div>
      </div>
    </div>
  </div>
);

const MatchesView = ({ user }: { user: User | null }) => (
  <div className="space-y-6 md:space-y-10 font-sans">
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-ug-teal" />
          <h2 className="text-lg md:text-xl font-black text-ug-navy">AI-Driven Funding Matches</h2>
        </div>
        <span className="bg-ug-teal/5 text-ug-teal px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit">Top Recommendations</span>
      </div>

      <div className="space-y-4">
        {[
          { name: 'Astra Venture Capital', desc: 'Specialized in MedTech & Biotech Innovation', score: '98%' },
          { name: 'Global Health Initiative', desc: 'Preventative Healthcare Sustainability Grants', score: '85%' },
        ].map((fund, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border border-gray-50 rounded-[2rem] bg-gray-50/50 hover:bg-white hover:border-ug-teal/20 hover:shadow-xl transition-all cursor-pointer group gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-ug-navy/5 rounded-2xl flex items-center justify-center text-ug-navy group-hover:bg-ug-teal group-hover:text-white transition shrink-0">
                <Globe size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-ug-navy text-sm group-hover:text-ug-teal transition truncate">{fund.name}</h4>
                <p className="text-[10px] font-medium text-gray-400 line-clamp-1">{fund.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
               <div className="text-left sm:text-right">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Match Score</p>
                  <p className="text-lg md:text-xl font-black text-ug-teal">{fund.score}</p>
               </div>
               <button className="bg-ug-navy text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-ug-teal transition shadow-lg">Connect</button>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Users size={20} className="text-ug-teal" />
        <h2 className="text-lg md:text-xl font-black text-ug-navy">Research Collaborators</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
         {[
           { name: 'Dr. Julian Marsh', role: 'Nanomaterials Specialist', alignment: '92% Match', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80' },
           { name: 'Dr. Sarah Chen', role: 'Bio-Sensing Systems', alignment: '88% Match', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80' },
         ].map((collab, i) => (
           <div key={i} className="bg-gray-50/50 border border-gray-50 rounded-[2.5rem] p-6 md:p-8 text-center hover:bg-white hover:shadow-2xl transition-all h-full flex flex-col justify-between group">
              <div>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-4 md:mb-6 shadow-xl border-4 border-white overflow-hidden bg-ug-navy">
                  <img src={collab.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" alt="" />
                </div>
                <h4 className="font-black text-ug-navy text-sm mb-1">{collab.name}</h4>
                <p className="text-[10px] font-bold text-ug-teal uppercase tracking-widest mb-4">{collab.role}</p>
                <div className="inline-block px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm mb-6 md:mb-8">
                  <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Alignment</p>
                  <p className="text-[11px] md:text-xs font-black text-ug-navy">{collab.alignment}</p>
                </div>
              </div>
              <button className="w-full border-2 border-ug-navy text-ug-navy py-3 md:py-4 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest hover:bg-ug-navy hover:text-white transition-all shadow-sm">Invite to Collaborate</button>
           </div>
         ))}
      </div>
    </div>
  </div>
);

const StudentDashboard = ({ user }: { user: User | null }) => {
   const [projects, setProjects] = useState<Project[]>([]);
   const navigate = useNavigate();
   useEffect(() => { StorageService.getProjects().then(setProjects); }, []);
   return (
      <div className="space-y-8">
         <UnifiedDashboardProfile user={user} onAction={() => navigate('/projects')} actionLabel="Explore Research" />
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard label="Opportunities" value="12" trend="+3 New" icon={BookOpen} />
            <StatCard label="Lab Access" value="Granted" trend="Verified" icon={GraduationCap} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
               <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <SectionTitle title="Collaboration Calls" subtitle="Active Research Projects Seeking Talent" />
                  <div className="space-y-4">
                     {projects.slice(0, 3).map(p => (
                        <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-gray-100 rounded-3xl bg-white hover:shadow-lg transition gap-4">
                           <div className="flex gap-4">
                              <div className="w-14 h-14 bg-ug-navy/5 rounded-2xl flex items-center justify-center text-ug-navy"><Briefcase size={24} /></div>
                              <div>
                                 <h4 className="font-black text-ug-navy text-lg">{p.title}</h4>
                                 <p className="text-[10px] font-black uppercase text-ug-teal tracking-widest">{p.department}</p>
                              </div>
                           </div>
                           <button onClick={() => navigate(`/projects/${p.id}`)} className="bg-ug-navy text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-ug-teal transition">Apply for Assistantship</button>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
            <div className="lg:col-span-4 space-y-8">
               {user?.id && <BookmarkedProjectsList userId={user.id} />}
               <HubStreamSidebar />
            </div>
         </div>
      </div>
   );
};

const PartnerDashboard = ({ user }: { user: User | null }) => {
   const [projects, setProjects] = useState<Project[]>([]);
   const navigate = useNavigate();
   useEffect(() => { StorageService.getProjects().then(setProjects); }, []);
   return (
      <div className="space-y-8">
         <UnifiedDashboardProfile user={user} onAction={() => navigate('/projects')} actionLabel="Invest in Tech" />
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Market Ready" value={projects.filter(p => p.status === ProjectStatus.MarketReady).length} trend="High ROI" icon={ShoppingBag} />
            <StatCard label="In-Review" value="5" trend="+1 Today" icon={Bookmark} />
            <StatCard label="NDA" value="Verified" trend="Secure" icon={Lock} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
               <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <SectionTitle title="Venture Portfolio" subtitle="Curated Technical Assets" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {projects.slice(0, 4).map(p => (
                        <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition border border-gray-100 cursor-pointer group">
                           <h4 className="font-black text-lg text-ug-navy mb-2 group-hover:text-ug-teal transition">{p.title}</h4>
                           <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.status}</span>
                              <ArrowRight size={16} className="text-gray-300 group-hover:text-ug-teal" />
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
            <div className="lg:col-span-4 space-y-8">
               {user?.id && <BookmarkedProjectsList userId={user.id} />}
               <HubStreamSidebar />
            </div>
         </div>
      </div>
   );
};

// --- CORE UTILITIES ---

const BookmarkedProjectsList: React.FC<{ userId: string }> = ({ userId }) => {
  const [bookmarks, setBookmarks] = useState<Project[]>([]);
  const navigate = useNavigate();
  useEffect(() => { StorageService.getBookmarks(userId).then(setBookmarks); }, [userId]);
  if (bookmarks.length === 0) return null;
  return (
    <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <SectionTitle title="Watchlist" subtitle="Secured Research Notifications" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookmarks.map(p => (
          <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/20 hover:bg-white hover:shadow-md transition cursor-pointer group">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0"><img src={p.image_url.split('|')[0]} className="w-full h-full object-cover" alt="" /></div>
            <div className="flex-1 min-w-0">
               <h4 className="font-black text-ug-navy text-sm truncate group-hover:text-ug-teal">{p.title}</h4>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.research_area}</p>
            </div>
            <Bookmark size={16} className="text-ug-teal fill-ug-teal" />
          </div>
        ))}
      </div>
    </section>
  );
};

const ProfileSettings: React.FC<{ user: User | null; onUpdate: () => void }> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website_url || '');
  const [website2, setWebsite2] = useState(user?.website_url_2 || '');
  const [website3, setWebsite3] = useState(user?.website_url_3 || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setWebsite(user.website_url || '');
      setWebsite2(user.website_url_2 || '');
      setWebsite3(user.website_url_3 || '');
      setAvatarPreview(user.avatar_url || '');
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      let avatarUrl = user.avatar_url;
      if (avatarFile) {
        avatarUrl = await StorageService.uploadFile(avatarFile, 'avatars');
      }

      await StorageService.updateProfile({ 
        id: user.id, 
        name, 
        bio, 
        role: user.role, // Ensure role is preserved
        email: user.email, // Ensure email is preserved
        website_url: website,
        website_url_2: website2,
        website_url_3: website3,
        avatar_url: avatarUrl 
      });
      
      showToast("Identity & Profile updated securely", "success");
      onUpdate();
    } catch (err: any) { 
      console.error("Profile Update Error:", err);
      showToast(`Update failed: ${err.message || 'Secure channel error'}`, "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm animate-fade-in">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-ug-navy text-white rounded-2xl shadow-lg"><Settings size={24} /></div>
        <div>
          <h3 className="text-2xl font-black text-ug-navy">Identity Management</h3>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">University Verified Records</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl space-y-12">
        {/* Avatar Upload Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
           <div 
            onClick={handleAvatarClick}
            className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-xl cursor-pointer group relative flex-shrink-0"
           >
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="Avatar Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><UserIcon size={48} /></div>
              )}
              <div className="absolute inset-0 bg-ug-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
           </div>
           <div className="text-center md:text-left">
              <h4 className="font-black text-ug-navy uppercase tracking-widest text-sm mb-2">Professional Identity Photo</h4>
              <p className="text-xs text-gray-500 font-medium max-w-sm">Recommended: Clear face-forward headshot. This will be visible on your researcher portfolio and disclosures.</p>
              <button 
                type="button"
                onClick={handleAvatarClick}
                className="mt-4 text-[10px] font-black text-ug-teal uppercase tracking-widest hover:text-ug-navy transition"
              >
                Change Discovery Asset
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-ug-navy uppercase tracking-widest flex items-center gap-2">
              <UserIcon size={14} className="text-ug-teal" /> Verified Academic/Corporate Name
            </label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-bold text-ug-navy focus:outline-none focus:ring-2 focus:ring-ug-teal/20 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-ug-navy uppercase tracking-widest flex items-center gap-2">
              <LinkIcon size={14} className="text-ug-teal" /> Portfolio / LinkedIn URL
            </label>
            <input type="url" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-bold text-ug-navy focus:outline-none focus:ring-2 focus:ring-ug-teal/20 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-ug-navy uppercase tracking-widest flex items-center gap-2">
              <LinkIcon size={14} className="text-ug-teal" /> Portfolio Link 2
            </label>
            <input type="url" placeholder="https://..." value={website2} onChange={e => setWebsite2(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-bold text-ug-navy focus:outline-none focus:ring-2 focus:ring-ug-teal/20 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-ug-navy uppercase tracking-widest flex items-center gap-2">
              <LinkIcon size={14} className="text-ug-teal" /> Portfolio Link 3
            </label>
            <input type="url" placeholder="https://..." value={website3} onChange={e => setWebsite3(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-bold text-ug-navy focus:outline-none focus:ring-2 focus:ring-ug-teal/20 transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-ug-navy uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} className="text-ug-teal" /> Professional Biography & Narrative
          </label>
          <textarea rows={5} value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ug-teal/20 transition-all resize-none" placeholder="Briefly describe your areas of expertise..." />
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-ug-navy text-white px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-ug-teal transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />} 
            Finalize Secure Update
          </button>
        </div>
      </form>

      <div className="mt-20 p-10 bg-ug-navy/5 rounded-[3rem] border border-dashed border-ug-navy/10 flex flex-col md:flex-row items-center gap-8">
         <div className="p-5 bg-white rounded-3xl shadow-sm text-ug-teal">
           <AlertCircle size={32} />
         </div>
         <div>
           <h4 className="font-black text-ug-navy uppercase tracking-widest text-sm mb-1">Identity Compliance</h4>
           <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-2xl">Updating your verified profile may trigger a re-validation from ORID administrators. All profile imagery is scanned for professional compliance with University of Ghana standards.</p>
         </div>
      </div>
    </div>
  );
};

export default Dashboards;
