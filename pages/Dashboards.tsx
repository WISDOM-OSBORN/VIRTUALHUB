
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, ProjectStatus, Visibility, Project, ResearchArea, User, AIProfile } from '../types';
import { StorageService } from '../services/storageService';
import { MatchingService } from '../services/matchingService';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Plus, FileText, 
  Settings, Bell, ShieldCheck, Download, 
  ChevronRight, Globe, Lock, X, Check, Award, GraduationCap, Eye, Search, Loader2, Star, Trash, Inbox, Archive, MoreVertical, CornerUpLeft, Paperclip, Maximize2, Minimize2, ChevronLeft,
  Briefcase, BookOpen, Handshake, Image as ImageIcon, Upload, DollarSign, FileCode,
  Home as HomeIcon,
  ShoppingBag, Bookmark, ArrowRight, User as UserIcon, Link as LinkIcon, Camera, AlertCircle, Info,
  Pencil, Trash2, FileUp, MessageSquare, MailOpen, Clock, Zap, Send as SendIcon, Calendar, File, LayoutGrid, Target, Sparkles, LogOut, Rocket
} from 'lucide-react';
import { useToast } from '../App';
import { Onboarding } from './Onboarding';

interface DashboardProps {
  role: UserRole;
  user: User | null;
}

// --- MOBILE BOTTOM NAV ---
const MobileNav: React.FC<{ activeTab: string; setActiveTab: (t: any) => void; role: UserRole; unreadCount: number }> = ({ activeTab, setActiveTab, role, unreadCount }) => {
  const tabs = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'matches', icon: Target, label: 'MY MATCHES' },
    { id: 'messages', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: UserIcon, label: 'Me' },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[80%] lg:w-auto bg-white/95 backdrop-blur-xl border border-gray-100 z-[100] flex items-center justify-around pb-2 pt-2 px-2 h-20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem]">
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
    { id: 'matches', icon: Target, label: 'MY MATCHES', sparkles: true },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  const getPortalTitle = () => {
    switch(role) {
      case UserRole.Student: return 'STUDENT';
      case UserRole.Investor: return 'INVESTOR';
      case UserRole.IndustryPartner: return 'INDUSTRY';
      default: return 'RESEARCHER';
    }
  };

  return (
    <div className="hidden lg:flex w-64 h-full bg-white border-r border-gray-100 flex-col p-6 shrink-0">
      <div className="mb-12 px-4 flex items-center gap-3">
        <div className="bg-ug-navy p-2 rounded-xl text-white">
          <GraduationCap size={20} />
        </div>
        <h2 className="text-sm font-black text-ug-navy uppercase tracking-widest leading-none">
          {getPortalTitle()}<br/><span className="text-ug-teal">PORTAL</span>
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
                 <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none transition" placeholder="Enter formal project title..." />
               </div>
 
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Research Area</label>
                   <select value={formData.research_area || ''} onChange={e => setFormData({...formData, research_area: e.target.value as ResearchArea})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none cursor-pointer">
                     {Object.values(ResearchArea).map(area => <option key={area} value={area}>{area}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                   <input required type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" placeholder="e.g. Computer Science" />
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
                 <textarea required rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-medium text-gray-600 focus:ring-2 focus:ring-ug-teal/20 outline-none resize-none leading-relaxed" placeholder="Describe your research methodology and potential impact..." />
               </div>
 
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                 <select 
                   value={formData.status || ''} 
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
                    <input type="text" value={formData.budget || ''} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" placeholder="$0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl font-bold text-ug-navy focus:ring-2 focus:ring-ug-teal/20 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Key Achievements & Milestones</label>
                <textarea rows={3} value={formData.achievements?.join('\n') || ''} onChange={e => setFormData({...formData, achievements: e.target.value.split('\n').filter(s => s.trim())})} className="w-full bg-white border border-gray-100 rounded-2xl p-4 font-medium text-gray-600 focus:ring-2 focus:ring-ug-teal/20 outline-none resize-none text-xs" placeholder="• Lab validation completed&#10;• Prototype developed&#10;• Clinical testing phase..." />
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

  const handleAcceptReveal = async (msg: any) => {
    if (!user) return;
    try {
      const releaseToken = `released:${Date.now()}`;
      await StorageService.updateEOIStatus(msg.id, releaseToken);
      showToast("Access Granted Successfully! Secure 1-hour session is live.", "success");
      
      // Auto reply with Access Granted notification message
      await StorageService.submitEOI(
        msg.project_id,
        user.name,
        `🟢 Access Granted. You have been granted secure, 1-hour decrypted access to download the Technical Disclosure PDF.`,
        msg.sender_id
      );
      
      // Refresh Conversations & Threads
      const updated = await StorageService.getConversations(user.id);
      setThreads(updated);
      
      // If we are currently viewing the thread, refresh it
      if (selectedThread) {
        const firstMsg = selectedThread[0];
        const partnerId = firstMsg.sender_id === user.id ? firstMsg.recipient_id : firstMsg.sender_id;
        const newThread = updated.find(t => t[0].project_id === firstMsg.project_id && (t[0].sender_id === partnerId || t[0].recipient_id === partnerId));
        if (newThread) setSelectedThread(newThread);
      }
    } catch (e: any) {
      showToast(e.message || "Failed to grant clearance", "error");
    }
  };

  const handleDeclineReveal = async (msg: any) => {
    if (!user) return;
    try {
      await StorageService.updateEOIStatus(msg.id, 'declined');
      showToast("Access Request Declined.", "info");
      
      // Auto reply with Access Declined notification
      await StorageService.submitEOI(
        msg.project_id,
        user.name,
        `🔴 Access Declined. Your request for technical brief access has been declined.`,
        msg.sender_id
      );
      
      // Refresh Conversations & Threads
      const updated = await StorageService.getConversations(user.id);
      setThreads(updated);
      
      if (selectedThread) {
        const firstMsg = selectedThread[0];
        const partnerId = firstMsg.sender_id === user.id ? firstMsg.recipient_id : firstMsg.sender_id;
        const newThread = updated.find(t => t[0].project_id === firstMsg.project_id && (t[0].sender_id === partnerId || t[0].recipient_id === partnerId));
        if (newThread) setSelectedThread(newThread);
      }
    } catch (e: any) {
      showToast(e.message || "Failed to decline clearance", "error");
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
    if (query.trim().length >= 2) {
      // Robust search: StorageService uses .or(name.ilike, email.ilike) which captures partial names
      const results = await StorageService.searchUsers(query.trim());
      setRecipientResults(results.filter(u => u.id !== user?.id));
    } else {
      setRecipientResults([]);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!selectedRecipient || !composeMessage.trim() || !user) {
      showToast("Please select a recipient and enter a message", "error");
      return;
    }
    setSending(true);
    try {
      await StorageService.submitEOI(null, user.name, composeMessage, selectedRecipient.id);
      showToast("Message Sent Successfully", "success");
      setIsComposing(false);
      setComposeMessage('');
      setComposeSubject('');
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
    <div className="bg-white md:rounded-[2rem] border-x md:border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-180px)] md:h-[750px] flex flex-col md:flex-row animate-fade-in font-sans relative">
      {/* Mobile Messages UI (Accordion Style) */}
      <div className="md:hidden flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white">
        {!selectedThread ? (
          <div className="flex flex-col">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-sm font-black text-ug-navy uppercase tracking-widest">Communications</h2>
              <button 
                onClick={() => setIsComposing(true)}
                className="p-2 bg-ug-teal text-white rounded-xl shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex-1">
              {[
                { id: 'inbox', icon: Inbox, label: 'Inbox', count: unreadCount },
                { id: 'starred', icon: Star, label: 'Starred' },
                { id: 'sent', icon: SendIcon, label: 'Sent' },
                { id: 'trash', icon: Trash, label: 'Trash' },
              ].map((cat) => (
                <div key={cat.id} className="border-b border-gray-50 last:border-none">
                  <button
                    onClick={() => {
                      if (activeCategory === cat.id) {
                        // Toggle or keep
                      } else {
                        setActiveCategory(cat.id as any);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-6 py-5 transition-all ${
                      activeCategory === cat.id ? 'bg-blue-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <cat.icon size={20} className={activeCategory === cat.id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`text-sm tracking-wide ${activeCategory === cat.id ? 'font-black text-blue-700' : 'font-bold text-gray-700'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {cat.count ? (
                        <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {cat.count}
                        </span>
                      ) : null}
                      <ChevronRight size={16} className={`transition-transform duration-300 text-gray-300 ${activeCategory === cat.id ? 'rotate-90 text-blue-600' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {activeCategory === cat.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50/50"
                      >
                        {filteredThreads.length === 0 ? (
                          <div className="p-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">
                            No {cat.label.toLowerCase()} yet
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100/50">
                            {filteredThreads.map((thread, i) => {
                              const lastMsg = thread[0];
                              const isUnread = !lastMsg.read && lastMsg.recipient_id === user?.id;
                              return (
                                <div 
                                  key={i}
                                  onClick={() => handleSelectThread(thread)}
                                  className={`p-5 flex items-center gap-4 active:bg-white transition-colors relative ${isUnread ? 'bg-white' : ''}`}
                                >
                                  {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
                                  <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-ug-navy shrink-0">
                                    <UserIcon size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-xs truncate ${isUnread ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                        {lastMsg.user_name}
                                      </span>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                                        {new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <h4 className={`text-[11px] truncate mb-1 ${isUnread ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                                      {lastMsg.projects?.title || 'General Inquiry'}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 line-clamp-1 italic">
                                      "{lastMsg.message}"
                                    </p>
                                  </div>
                                  <ChevronRight size={14} className="text-gray-300" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Mobile Detail View */
          <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10">
              <button 
                onClick={() => setSelectedThread(null)}
                className="p-2 bg-gray-50 rounded-xl text-gray-600 active:scale-95 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">{selectedThread[0].projects?.title || 'General Inquiry'}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{selectedThread[0].user_name}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/20">
              {[...selectedThread].reverse().map((msg, i) => (
                <div key={i} className={`flex items-start gap-3 ${msg.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${msg.sender_id === user?.id ? 'bg-ug-navy text-white' : 'bg-white border border-gray-100 text-ug-navy'}`}>
                    {msg.user_name.charAt(0)}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                    msg.sender_id === user?.id ? 'bg-[#0092B0] text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.message}</div>

                    {msg.message.includes('🔐 Technical Disclosure Request') && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                        {(!msg.status || msg.status === 'pending') ? (
                          msg.sender_id !== user?.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptReveal(msg)}
                                className="flex-1 bg-ug-teal hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition shadow-sm active:scale-95"
                              >
                                Accept Request
                              </button>
                              <button
                                onClick={() => handleDeclineReveal(msg)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition shadow-sm active:scale-95"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-center py-1.5 bg-pink-50 text-pink-700 rounded-xl border border-pink-100 text-[9px] font-black uppercase tracking-wider">
                              🔒 Clearance Pending
                            </div>
                          )
                        ) : msg.status.startsWith('released') ? (
                          <div className="flex items-center gap-1.5 justify-center py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                            <Check size={12} strokeWidth={3} /> Access Granted
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-center py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-100 text-[9px] font-black uppercase tracking-wider">
                            Access Declined 🔴
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`text-[8px] mt-2 opacity-60 text-right ${msg.sender_id === user?.id ? 'text-white' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-gray-50 rounded-[1.5rem] p-2 flex flex-col border border-gray-100 focus-within:bg-white focus-within:shadow-lg transition-all">
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type message..."
                    className="w-full bg-transparent p-2 text-xs focus:outline-none resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                <button 
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition disabled:opacity-50 h-10 w-10 flex items-center justify-center"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <SendIcon size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Gmail Sidebar (Hidden on Mobile) */}
      <div className={`hidden md:flex w-64 border-r border-gray-100 flex-col bg-white pt-4 transition-transform duration-300`}>
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

      {/* Desktop Main Content Area (Hidden on Mobile) */}
      <div className={`hidden md:flex flex-1 flex flex-col min-w-0 bg-white z-10 transition-transform duration-300 ${!isMobileListOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
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
                        <div>{msg.message}</div>

                        {msg.message.includes('🔐 Technical Disclosure Request') && (
                          <div className="mt-4 pt-3 border-t border-gray-100 space-y-3 max-w-md">
                            {(!msg.status || msg.status === 'pending') ? (
                              msg.sender_id !== user?.id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptReveal(msg)}
                                    className="flex-1 bg-ug-teal hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition shadow-sm active:scale-95"
                                  >
                                    Accept Request
                                  </button>
                                  <button
                                    onClick={() => handleDeclineReveal(msg)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase tracking-wider py-2 rounded-xl transition shadow-sm active:scale-95"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 justify-center py-1.5 bg-pink-50 text-pink-700 rounded-xl border border-pink-100 text-[9px] font-black uppercase tracking-wider">
                                  🔒 Clearance Pending
                                </div>
                              )
                            ) : msg.status.startsWith('released') ? (
                              <div className="flex items-center gap-1.5 justify-center py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                <Check size={12} strokeWidth={3} /> Access Granted
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-center py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-100 text-[9px] font-black uppercase tracking-wider">
                                Access Declined 🔴
                              </div>
                            )}
                          </div>
                        )}

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
        <div className="fixed inset-0 md:inset-auto md:bottom-0 md:right-10 md:w-[500px] md:h-[600px] bg-white shadow-2xl md:rounded-t-3xl border border-gray-200 z-[300] flex flex-col animate-slide-up">
          <div className="bg-ug-navy text-white px-6 py-6 md:py-4 md:rounded-t-3xl flex items-center justify-between shrink-0">
            <span className="text-sm font-black uppercase tracking-widest text-ug-teal">New Interaction</span>
            <button onClick={() => setIsComposing(false)} className="p-2 hover:bg-white/10 rounded-2xl transition">
              <X size={24} className="md:w-5 md:h-5" />
            </button>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Recipient</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search collaborators by name..." 
                  value={selectedRecipient ? selectedRecipient.name : composeRecipient}
                  onChange={(e) => handleRecipientSearch(e.target.value)}
                  disabled={!!selectedRecipient}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold disabled:opacity-50 disabled:bg-blue-50/50 disabled:border-blue-100"
                />
                {selectedRecipient && (
                  <button 
                    onClick={() => setSelectedRecipient(null)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition shadow-sm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {recipientResults.length > 0 && !selectedRecipient && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[310] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2 space-y-1">
                    {recipientResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedRecipient(u);
                          setRecipientResults([]);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-blue-50/50 rounded-2xl transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-ug-navy/5 flex items-center justify-center text-ug-navy group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <UserIcon size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-gray-900 group-hover:text-blue-700 transition">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Topic</label>
              <input 
                type="text" 
                placeholder="Brief subject description" 
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-6 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold" 
              />
            </div>

            <div className="flex-1 min-h-[200px]">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Message</label>
              <textarea 
                placeholder="Share your thoughts or research proposal..." 
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                className="w-full h-full min-h-[200px] bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none shadow-inner" 
              />
            </div>
          </div>
          <div className="p-6 md:p-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-white sticky bottom-0">
            <button 
              onClick={handleSendDirectMessage}
              disabled={sending || !selectedRecipient || !composeMessage.trim()}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.4)] disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <><SendIcon size={18} /> Transmit Message</>}
            </button>
            <div className="flex items-center gap-6 text-gray-300">
              <button className="hover:text-blue-600 transition-colors"><Paperclip size={24} /></button>
              <button className="hover:text-blue-600 transition-colors"><ImageIcon size={24} /></button>
              <div className="w-px h-6 bg-gray-100 mx-2"></div>
              <button onClick={() => setIsComposing(false)} className="hover:text-red-500 transition-colors"><Trash size={24} /></button>
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

  const [profileMode, setProfileMode] = useState<'identity' | 'insights'>('identity');
  const [isRerunningOnboarding, setIsRerunningOnboarding] = useState(false);

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
      
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        <header className="bg-ug-navy text-white flex items-center justify-between px-4 sm:px-8 py-5 shrink-0 shadow-2xl z-50">
          <nav className="flex items-center gap-6 lg:gap-10 ml-0 lg:ml-8">
             {['Home', 'Projects', 'Products', 'News'].map(link => (
               <button 
                 key={link} 
                 onClick={() => navigate(link === 'Home' ? '/' : `/${link.toLowerCase()}`)}
                 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.1em] lg:tracking-[0.25em] hover:text-ug-teal transition-all cursor-pointer opacity-80 hover:opacity-100"
               >
                 {link}
               </button>
             ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-6">
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

            <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-6 border-l border-white/10">
              {/* Home Icon - Only show on mobile header as a symbol */}
              <button 
                onClick={() => navigate('/')}
                className="sm:hidden p-2 text-white/70 hover:text-white transition-all group relative rounded-xl hover:bg-white/10"
              >
                <HomeIcon size={20} />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-gray-900 text-[7px] font-black uppercase rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                  Home
                </span>
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

        <main className="flex-1 overflow-y-auto w-full bg-[#fcfdfe]">
          <div className="max-w-[1600px] mx-auto w-full p-4 lg:p-10 pb-40 lg:pb-12 space-y-8 lg:space-y-12">
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
              {(role === UserRole.Investor || role === UserRole.IndustryPartner) && <InvestorDashboard user={localUser} />}
            </div>
          )}

          {activeTab === 'matches' && (
             <MatchesView user={localUser} />
          )}

          {activeTab === 'messages' && <MessagesSection user={localUser} initialThreadId={initialThreadId} />}
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-ug-navy tracking-tight uppercase">Researcher Portfolio</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-1 italic">Verified Hub Identity Management</p>
                </div>
                {!isRerunningOnboarding && (
                  <div className="flex bg-gray-100 p-1 md:p-1.5 rounded-2xl md:rounded-3xl shadow-inner">
                    <button 
                      onClick={() => setProfileMode('identity')}
                      className={`px-6 md:px-10 py-3 rounded-[1.25rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${profileMode === 'identity' ? 'bg-ug-navy text-white shadow-xl' : 'text-gray-400 hover:text-ug-navy'}`}
                    >
                      Identity & Narrative
                    </button>
                    <button 
                      onClick={() => setProfileMode('insights')}
                      className={`px-6 md:px-10 py-3 rounded-[1.25rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${profileMode === 'insights' ? 'bg-ug-navy text-white shadow-xl' : 'text-gray-400 hover:text-ug-navy'}`}
                    >
                      AI Research Analysis
                    </button>
                  </div>
                )}
              </div>

              {isRerunningOnboarding ? (
                <div className="animate-fade-in">
                  <Onboarding 
                    user={localUser} 
                    isEmbedded={true}
                    onComplete={() => {
                      setIsRerunningOnboarding(false);
                      if (localUser?.id) {
                        localStorage.removeItem(`onboarding_skipped_${localUser.id}`);
                      }
                      refreshProfile();
                    }}
                    onSkip={() => setIsRerunningOnboarding(false)}
                  />
                </div>
              ) : (
                <>
                  {!localUser?.ai_profile && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 shadow-sm">
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                          <AlertCircle size={24} />
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                          <h4 className="text-sm font-black text-ug-navy uppercase tracking-wider">Complete Your AI Match Profile</h4>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            You currently do not have an active AI Match Profile. Industry delegates, researchers, and students rely on high-fidelity AI recommendations to discover you. Complete the interactive setup to get matched!
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsRerunningOnboarding(true)}
                        className="w-full md:w-auto bg-amber-600 hover:bg-amber-750 text-white px-8 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition shadow-md active:scale-95 duration-150 shrink-0 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={14} /> Start Interactive Onboarding
                      </button>
                    </div>
                  )}

                  {profileMode === 'identity' ? (
                    <div className="space-y-6">
                      {localUser?.ai_profile && (
                        <div className="flex justify-end">
                          <button 
                            type="button"
                            onClick={() => setIsRerunningOnboarding(true)}
                            className="bg-ug-teal/10 hover:bg-ug-teal hover:text-white text-ug-teal px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 border border-ug-teal/20"
                          >
                            <Sparkles size={12} strokeWidth={2.5} /> Refine AI Matching (Retake Questionnaire / CV)
                          </button>
                        </div>
                      )}
                      <ProfileSettings user={localUser} onUpdate={refreshProfile} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                      <div className="lg:col-span-8 flex flex-col gap-10">
                        <ProfileInsight profile={localUser?.ai_profile} />
                      </div>
                      <div className="lg:col-span-4 shrink-0 space-y-8">
                        <div className="bg-ug-navy text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition duration-1000">
                            <Target size={120} />
                          </div>
                          <div className="relative z-10 space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-ug-teal uppercase tracking-widest mb-2">Ecosystem Compliance</h4>
                              <h3 className="text-xl font-black tracking-tight uppercase leading-tight">Neural Sync Status</h3>
                            </div>
                            <p className="text-xs font-medium leading-loose opacity-70 italic font-sans animate-pulse">
                              "AI insights are dynamically synthesized from your verified academic records. Significant changes to your biography may take up to 24 hours to re-index in the Neural Stream."
                            </p>
                            <div className="pt-6 border-t border-white/10 space-y-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-ug-teal rounded-2xl flex items-center justify-center shadow-lg"><Zap size={18} /></div>
                                  <div>
                                    <p className="text-[9px] font-black text-ug-teal uppercase tracking-widest animate-pulse">Matching Fidelity</p>
                                    <p className="text-sm font-black text-white">98.4% Accuracy</p>
                                  </div>
                               </div>
                            </div>
                            {localUser?.ai_profile && (
                              <button
                                onClick={() => setIsRerunningOnboarding(true)}
                                className="w-full bg-ug-teal text-ug-navy hover:bg-white text-center cursor-pointer font-black hover:scale-105 transition duration-150 py-3 rounded-2xl text-[9px] uppercase tracking-widest"
                              >
                                Update Mapping Analysis
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Visibility</h4>
                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                              <span className="text-[10px] font-black text-ug-navy uppercase tracking-widest">Portfolio Visible</span>
                              <div className="w-8 h-4 bg-ug-teal rounded-full relative">
                                 <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                              </div>
                           </div>
                           <p className="text-[9px] text-gray-400 font-medium italic">Your profile is currently discoverable to verified technical partners and industry delegates.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
  const [eois, setEois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const pList = await StorageService.getMyProjects(user.id);
      setProjects(pList);
      const eoiList = await StorageService.getEOIsForPI(user.id);
      setEois(eoiList);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user?.id, refreshTrigger]);

  const handleAcceptReveal = async (msg: any) => {
    if (!user) return;
    try {
      const releaseToken = `released:${Date.now()}`;
      await StorageService.updateEOIStatus(msg.id, releaseToken);
      showToast("Access Granted Successfully! Secure 1-hour session is live.", "success");
      
      // Auto reply with Access Granted notification message
      await StorageService.submitEOI(
        msg.project_id,
        user.name,
        `🟢 Access Granted. You have been granted secure, 1-hour decrypted access to download the Technical Disclosure PDF.`,
        msg.sender_id
      );
      
      // Update local eois state
      setEois(prev => prev.map(item => item.id === msg.id ? { ...item, status: releaseToken } : item));
    } catch (e: any) {
      showToast(e.message || "Failed to grant clearance", "error");
    }
  };

  const handleDeclineReveal = async (msg: any) => {
    if (!user) return;
    try {
      await StorageService.updateEOIStatus(msg.id, 'declined');
      showToast("Access Request Declined.", "info");
      
      // Auto reply with Access Declined notification
      await StorageService.submitEOI(
        msg.project_id,
        user.name,
        `🔴 Access Declined. Your request for technical brief access has been declined.`,
        msg.sender_id
      );
      
      setEois(prev => prev.map(item => item.id === msg.id ? { ...item, status: 'declined' } : item));
    } catch (e: any) {
      showToast(e.message || "Failed to decline clearance", "error");
    }
  };

  const activeProject = projects[0]; // For visual demonstration of hero card

  const totalViews = projects.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalInteractions = projects.reduce((acc, p) => acc + (p.expressions_of_interest || 0) + (p.requests || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10">
      <div className="md:col-span-2 lg:col-span-8 lg:col-start-1 space-y-8">
        <UnifiedDashboardProfile user={user} onAction={() => {
           onOpenModal(null);
        }} actionLabel="New Project Disclosure" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* INBOUND PORTAL - INTERACTION HUB */}
        <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm mt-8">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <SectionTitle title="Interaction Hub" subtitle="Student Applications & Technical Disclosures" />
          </div>
          <div className="space-y-4 mt-6">
            {eois.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Inbox className="mx-auto text-gray-300 mb-3" size={32} />
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">No requests received yet.</p>
              </div>
            ) : eois.map(eoi => {
              const isReveal = eoi.message.includes('[REVEAL_REQUEST]') || eoi.message.includes('🔐 Technical Disclosure Request');
              const isAssistantship = eoi.message.includes('[ASSISTANTSHIP_APPLICATION]');
              const isScholarship = eoi.message.includes('[SCHOLARSHIP_APPLICATION]');
              const isLabAccess = eoi.message.includes('[LAB_WORKSPACE_ACCESS]');
              
              let typeLabel = "Inquiry";
              let badgeColor = "bg-gray-100 text-gray-600 border border-gray-200";
              let cleanMessage = eoi.message;

              if (isReveal) {
                typeLabel = "Key Document Reveal Requested";
                badgeColor = "bg-pink-50 text-pink-700 border border-pink-200/50";
                if (eoi.message.includes('🔐 Technical Disclosure Request')) {
                  cleanMessage = eoi.message;
                } else {
                  cleanMessage = eoi.message.substring(eoi.message.indexOf(']') + 1).trim();
                }
              } else if (isAssistantship) {
                typeLabel = "Graduate Assistantship Candidate";
                badgeColor = "bg-blue-50 text-blue-700 border border-blue-200/50";
                cleanMessage = eoi.message.substring(eoi.message.indexOf(']') + 1).trim();
              } else if (isScholarship) {
                typeLabel = "Scholarship Fellow Inquiry";
                badgeColor = "bg-amber-50 text-amber-700 border border-amber-200/50";
                cleanMessage = eoi.message.substring(eoi.message.indexOf(']') + 1).trim();
              } else if (isLabAccess) {
                typeLabel = "Lab Space Authorization";
                badgeColor = "bg-purple-50 text-purple-700 border border-purple-200/50";
                cleanMessage = eoi.message.substring(eoi.message.indexOf(']') + 1).trim();
              }

              return (
                <div key={eoi.id} className="p-5 border border-gray-100 rounded-3xl bg-gray-50/20 hover:bg-white hover:shadow-lg transition space-y-4">
                  <div className="flex justify-between items-start gap-3 flex-wrap sm:flex-nowrap">
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider mb-2 ${badgeColor}`}>
                        {typeLabel}
                      </span>
                      <h4 className="font-black text-ug-navy text-xs mb-1">From: {eoi.user_name}</h4>
                      <p className="text-[10px] text-gray-400">Associated Asset: {eoi.projects?.title || 'Direct/Hub'}</p>
                    </div>
                    {eoi.status && eoi.status.startsWith('released') ? (
                      <span className="flex items-center gap-1.5 text-ug-success text-[9px] font-black uppercase tracking-wider bg-ug-success/10 px-3 py-1.5 rounded-xl border border-ug-success/20">
                        <Check size={12} strokeWidth={3} /> Approved / Released
                      </span>
                    ) : eoi.status === 'declined' ? (
                      <span className="flex items-center gap-1.5 text-red-700 text-[9px] font-black uppercase tracking-wider bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                        Declined / Restricted
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[8px] font-black uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-250 font-bold">
                        Pending Assessment
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-[10px] leading-relaxed italic border-l-2 border-ug-teal/30 pl-4 py-1 whitespace-pre-wrap">
                    "{cleanMessage}"
                  </p>

                  {(!eoi.status || eoi.status === 'pending') && (
                    <div className="flex gap-3 pt-1">
                      {isReveal ? (
                        <>
                          <button
                            onClick={() => handleAcceptReveal(eoi)}
                            className="bg-ug-teal text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <Award size={12} /> Approve Secure Reveal
                          </button>
                          <button
                            onClick={() => handleDeclineReveal(eoi)}
                            className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            Decline Request
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await StorageService.updateEOIStatus(eoi.id, 'released');
                              setEois(prev => prev.map(item => item.id === eoi.id ? { ...item, status: 'released' } : item));
                              showToast("Clearance and Approval Disclosed Successfully!", "success");
                            } catch (err: any) {
                              showToast(err.message || "Failed to issue approval", "error");
                            }
                          }}
                          className="bg-ug-navy text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-ug-teal transition flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Award size={12} /> Accredit Application
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="md:col-span-2 lg:col-span-4 space-y-8 border-t lg:border-t-0 pt-8 lg:pt-0">
        <HubStreamSidebar />
        {user?.id && <BookmarkedProjectsList userId={user.id} />}
      </div>
    </div>
  );
};

const UnifiedDashboardProfile = ({ user, onAction, actionLabel }: { user: User | null, onAction: () => void, actionLabel: string }) => (
  <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-ug-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition duration-1000"></div>
    
    <div className="relative shrink-0">
      <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2.5rem] border-4 border-white shadow-2cl overflow-hidden bg-ug-navy">
        {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-full h-full p-6 text-white/20" />}
      </div>
      <div className="absolute -bottom-1 -right-1 bg-ug-teal p-1.5 rounded-full border-2 md:border-4 border-white text-white shadow-lg">
        <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" />
      </div>
    </div>

    <div className="flex-1 text-center md:text-left min-w-0">
      <h2 className="text-xl md:text-3xl font-black text-ug-navy tracking-tight mb-1 truncate">{user?.name}</h2>
      <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 truncate">{user?.role} • {user?.department || 'University of Ghana'}</p>
      <div className="flex items-center justify-center md:justify-start gap-2 bg-gray-50 w-fit px-3 py-1.5 rounded-xl border border-gray-100 mx-auto md:mx-0">
        <Plus size={10} className="text-ug-teal" />
        <span className="text-[8px] font-black text-ug-navy uppercase tracking-widest">Identity Verified</span>
      </div>
    </div>

    <button 
      onClick={onAction}
      className="w-full md:w-auto bg-ug-navy text-white px-8 py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-2xl hover:bg-ug-teal transition-all flex items-center justify-center gap-3 active:scale-95"
    >
      <Plus size={16} /> {actionLabel}
    </button>
  </div>
);

const StatCardV2 = ({ label, value, trend, icon: Icon }: any) => null;
const RedesignedResearcherProfile = ({ user, onDisclosure }: { user: User | null, onDisclosure: () => void }) => null;

const ActiveProjectHero = ({ project }: { project: Project }) => (
  <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden animate-fade-in group">
    <div className="relative h-48 md:h-64 overflow-hidden">
      <img src={project.image_url.split('|')[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-ug-navy via-ug-navy/40 to-transparent"></div>
      <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2">
        <div className="bg-ug-teal text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse w-fit">
          ACTIVE PROJECT
        </div>
        <h3 className="text-xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-2">{project.title}</h3>
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

const ProfileInsight = ({ profile, onRefresh }: { profile: AIProfile | null, onRefresh?: () => void }) => {
  if (!profile) return (
    <div className="bg-ug-navy/5 border border-dashed border-ug-navy/20 p-10 rounded-[3rem] text-center">
      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
        <Sparkles size={32} className="text-ug-teal/50" />
      </div>
      <h3 className="text-sm font-black text-ug-navy uppercase tracking-widest mb-2">Neural Profile Pending</h3>
      <p className="text-[11px] text-gray-500 font-medium italic max-w-xs mx-auto">Upload your academic documents or resume in the overview to unlock AI-powered semantic matching and profile insights.</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in group/insight">
      {/* Narrative Section */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
          <Target size={180} />
        </div>
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h4 className="text-[10px] font-black text-ug-teal uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
              <Sparkles size={12} /> Researcher Intelligence
            </h4>
            <h3 className="text-xl font-black text-ug-navy uppercase tracking-tight">AI Narrative Summary</h3>
          </div>
          <button 
            onClick={onRefresh}
            className="p-3 bg-gray-50 text-gray-400 hover:text-ug-teal hover:bg-ug-teal/10 rounded-2xl transition opacity-0 group-hover:opacity-100"
            title="Re-process Profile"
          >
            <Upload size={16} />
          </button>
        </div>

        <p className="text-sm md:text-base font-medium text-gray-600 leading-relaxed italic relative z-10">
          "{profile.semantic_summary}"
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-10 border-t border-gray-50 relative z-10">
           <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Experience Level</span>
              <span className="text-[10px] font-black text-ug-navy uppercase bg-ug-navy/5 px-3 py-1 rounded-full inline-block">{profile.professional_profile?.experience_level || 'General'}</span>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Collab Mode</span>
              <span className="text-[10px] font-black text-ug-navy uppercase bg-ug-navy/5 px-3 py-1 rounded-full inline-block">{profile.collaboration_profile?.preferred_collaboration_types?.[0] || 'Flexible'}</span>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Projects</span>
              <span className="text-[10px] font-black text-ug-navy uppercase">{profile.projects?.length || 0} Initiatives</span>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Education</span>
              <span className="text-[10px] font-black text-ug-navy uppercase">{profile.education?.length || 0} Credentials</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Stack */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-ug-navy text-white rounded-xl flex items-center justify-center shadow-lg"><FileCode size={20} /></div>
             <div>
               <h4 className="text-sm font-black text-ug-navy uppercase tracking-tight">Technological Stack</h4>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Validated Skillsets</p>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {((): string[] => {
              const tech = profile.skills?.technical_skills || [];
              const tools = profile.skills?.tools_and_technologies || [];
              return [...tech, ...tools];
            })().map((s, i) => (
              <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 uppercase transition hover:border-ug-teal/30 hover:bg-white hover:text-ug-teal cursor-default">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Education Stack */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-ug-teal text-white rounded-xl flex items-center justify-center shadow-lg"><Award size={20} /></div>
             <div>
               <h4 className="text-sm font-black text-ug-navy uppercase tracking-tight">Verified Education</h4>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Academic Credentials</p>
             </div>
          </div>
          <div className="space-y-6">
            {(profile.education || []).map((edu, i) => (
              <div key={i} className="flex gap-5 items-start group/edu">
                <div className="w-10 h-10 rounded-2xl bg-ug-navy/5 flex items-center justify-center text-ug-navy shrink-0 group-hover/edu:bg-ug-teal group-hover/edu:text-white transition duration-500">
                  <GraduationCap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-ug-navy leading-tight mb-1 uppercase tracking-tight">{edu.degree}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{edu.institution}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-ug-teal uppercase">{edu.field_of_study}</span>
                    <span className="text-[9px] text-gray-300">•</span>
                    <span className="text-[9px] font-bold text-gray-400">{edu.graduation_year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Initiatives Feed */}
      {(profile.projects?.length || 0) > 0 && (
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group/projects">
           <div className="flex items-center gap-3 mb-10">
             <div className="w-10 h-10 bg-ug-teal/10 text-ug-teal rounded-xl flex items-center justify-center"><Rocket size={20} /></div>
             <div>
               <h4 className="text-sm font-black text-ug-navy uppercase tracking-tight">Key Initiatives</h4>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Project Portfolio Analysis</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {(profile.projects || []).map((p, i) => (
              <div key={i} className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:border-ug-teal/20 transition-all text-left group/p">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-black text-ug-teal uppercase tracking-widest">{p.industry}</span>
                  <div className="text-gray-200 group-hover/p:text-ug-teal transition"><LinkIcon size={14} /></div>
                </div>
                <h5 className="text-xs font-black text-ug-navy uppercase leading-tight mb-2">{p.project_name}</h5>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2">Research focused on {p.industry.toLowerCase()} innovation and technical implementation.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchesView = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const [profileMatches, setProfileMatches] = useState<any[]>([]);
  const [projectMatches, setProjectMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllProfiles, setShowAllProfiles] = useState(false);

  const fetchMatches = async () => {
    if (!user?.id || !user?.embedding) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Safety: Ensure embedding is 768 before sending to RPC
      let currentEmbedding = user.embedding;
      if (currentEmbedding.length !== 768) {
        currentEmbedding = currentEmbedding.slice(0, 768);
        if (currentEmbedding.length < 768) {
           currentEmbedding = [...currentEmbedding, ...new Array(768 - currentEmbedding.length).fill(0)];
        }
      }
      
      const { profiles, projects } = await StorageService.getMatches(user.id, currentEmbedding);
      
      if (profiles.length === 0 && projects.length === 0) {
        setProfileMatches([]);
        setProjectMatches([]);
        setLoading(false);
        return;
      }

      // Perform AI re-ranking if we have an AI profile
      if (user.ai_profile) {
        setIsProcessing(true);
        try {
          const [rankedProfiles, rankedProjects] = await Promise.all([
            MatchingService.rankMatches(user.ai_profile, profiles),
            MatchingService.rankMatches(user.ai_profile, projects)
          ]);
          setProfileMatches(rankedProfiles.length > 0 ? rankedProfiles : profiles.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
          setProjectMatches(rankedProjects.length > 0 ? rankedProjects : projects.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
        } catch (rankError) {
          console.warn("AI Ranking failed, falling back to vector similarity:", rankError);
          setProfileMatches(profiles.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
          setProjectMatches(projects.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
        }
      } else {
        setProfileMatches(profiles.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
        setProjectMatches(projects.map(p => ({ ...p, ai_score: Math.round(p.similarity * 100) })));
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const checkAndFetch = async () => {
      if (!user?.id) return;
      
      // If user is missing embedding but has bio/semantic_summary, we might need a refresh
      if (!user.embedding && user.semantic_summary) {
        setLoading(true);
        try {
          // Re-fetch user profile once to see if it was updated in DB
          const updatedUser = await StorageService.getProfile(user.id);
          if (updatedUser?.embedding) {
            // This will trigger the fetchMatches effect below
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to check for user embedding refresh:", e);
        }
      }
      
      fetchMatches();
    };
    
    checkAndFetch();
  }, [user?.id, user?.embedding, user?.semantic_summary]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-ug-teal" size={40} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Running Neural Matching Engines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 font-sans">
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-ug-teal" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <Target size={24} className="text-ug-teal" />
            <div>
              <h2 className="text-xl md:text-2xl font-black text-ug-navy uppercase">Neural Matching Hub</h2>
              <p className="text-[10px] font-black text-ug-teal uppercase tracking-[0.25em] mt-1">Intelligent Research Alignment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-ug-teal/10 px-4 py-2 rounded-full border border-ug-teal/10">
             <span className={`${isProcessing ? 'animate-bounce' : 'animate-pulse'} w-2 h-2 bg-ug-teal rounded-full`}></span>
             <span className="text-[9px] font-black text-ug-teal uppercase tracking-widest">
               {isProcessing ? 'AI Agent Reasoning...' : 'Neural Stream Active'}
             </span>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 mb-8 relative z-10">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-[0.1em]">
            {profileMatches.length + projectMatches.length === 0 ? 
              "No high-fidelity matches found. Try expanding your research profile or industry interests." :
              `Cross-referencing your profile against the ecosystem. Found ${projectMatches.length} strategic projects and ${profileMatches.length} high-alignment collaborators.`
            }
          </p>
        </div>

        <div className="space-y-4">
          {(showAllProjects ? projectMatches : projectMatches.slice(0, 5)).map((proj, i) => (
            <div key={proj.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border border-gray-100 rounded-[2rem] bg-gray-50/30 hover:bg-white hover:border-ug-teal/20 hover:shadow-xl transition-all cursor-pointer group gap-4 text-left">
              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-ug-navy/5 rounded-2xl flex items-center justify-center text-ug-navy group-hover:bg-ug-teal group-hover:text-white transition shrink-0 overflow-hidden">
                  {proj.image_url ? 
                    <img src={proj.image_url.split('|')[0]} className="w-full h-full object-cover" alt="" /> :
                    <Globe size={24} />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-ug-teal uppercase tracking-widest px-2 py-0.5 bg-ug-teal/5 rounded-full">{proj.ai_label || 'Project Match'}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{proj.research_area}</span>
                  </div>
                  <h4 className="font-black text-ug-navy text-sm group-hover:text-ug-teal transition truncate uppercase tracking-tight">{proj.title}</h4>
                  <p className="text-[10px] font-medium text-gray-400 line-clamp-1 italic">"{proj.ai_reasoning || proj.description}"</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                 <div className="text-left sm:text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">AI Match Score</p>
                    <p className="text-lg md:text-xl font-black text-ug-teal">
                      {proj.ai_score !== undefined && proj.ai_score !== null && !isNaN(Number(proj.ai_score)) 
                        ? `${Math.round(Number(proj.ai_score))}%` 
                        : '80%'
                      }
                    </p>
                 </div>
                 <button className="bg-ug-navy text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-ug-teal transition shadow-lg shrink-0">Express Interest</button>
              </div>
            </div>
          ))}
          {projectMatches.length > 5 && !showAllProjects && (
            <button 
              onClick={() => setShowAllProjects(true)}
              className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-ug-teal hover:text-ug-teal transition-all"
            >
              See {projectMatches.length - 5} More Projects
            </button>
          )}

          {projectMatches.length === 0 && (
            <div className="py-16 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-200">
                  <Rocket size={32} />
               </div>
               <h4 className="text-sm font-black text-ug-navy mb-2">No Strategic Project Matches Yet</h4>
               <p className="text-[10px] font-medium text-gray-400 max-w-xs mx-auto leading-relaxed mb-6">
                 We couldn't find any initiatives that perfectly align with your current research vector. Try exploring the global project directory.
               </p>
               <button 
                 onClick={() => navigate('/projects')}
                 className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-ug-teal hover:text-ug-teal transition-all"
               >
                 Explore Project Discovery
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <Users size={20} className="text-ug-teal" />
          <h2 className="text-lg md:text-xl font-black text-ug-navy">Strategic Research Collaborators</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
           {(showAllProfiles ? profileMatches : profileMatches.slice(0, 5)).map((collab, i) => (
             <div key={collab.id} className="bg-gray-50/30 border border-gray-50 rounded-[2.5rem] p-6 md:p-8 text-center hover:bg-white hover:shadow-2xl transition-all h-full flex flex-col justify-between group relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-4">
                  <div className="text-[9px] font-black text-ug-teal bg-ug-teal/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    {collab.ai_label || 'High Alignment'}
                  </div>
                </div>
                <div>
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl mx-auto mb-4 md:mb-6 shadow-xl border-4 border-white overflow-hidden bg-ug-navy relative group-hover:scale-105 transition-transform duration-500">
                    {collab.image_url ? 
                      <img src={collab.image_url} className="w-full h-full object-cover" alt="" /> :
                      <UserIcon className="w-full h-full p-6 text-white/20" />
                    }
                  </div>
                  <h4 className="font-black text-ug-navy text-sm mb-1">{collab.name || 'UG Science Partner'}</h4>
                  <p className="text-[10px] font-bold text-ug-teal uppercase tracking-widest mb-4">{collab.role}</p>
                  
                  <div className="p-4 bg-white/50 rounded-2xl border border-gray-100 mb-6 text-left">
                    <p className="text-[9px] text-gray-500 font-medium leading-relaxed italic line-clamp-3">
                      "{collab.ai_reasoning || collab.semantic_summary || 'Semantic profile match detected.'}"
                    </p>
                  </div>

                  <div className="inline-block px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm mb-6 md:mb-8">
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Compatibility</p>
                        <p className="text-xs font-black text-ug-navy">
                          {collab.ai_score !== undefined && collab.ai_score !== null && !isNaN(Number(collab.ai_score)) 
                            ? `${Math.round(Number(collab.ai_score))}%` 
                            : '80%'
                          }
                        </p>
                      </div>
                      <div className="w-px h-6 bg-gray-100"></div>
                      <div className="text-left">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Rank</p>
                        <p className="text-xs font-black text-ug-teal">#{i + 1}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full border-2 border-ug-navy text-ug-navy py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest hover:bg-ug-navy hover:text-white transition-all shadow-sm active:scale-95">Initiate Collaboration</button>
             </div>
           ))}
           
           {profileMatches.length > 5 && !showAllProfiles && (
              <button 
                onClick={() => setShowAllProfiles(true)}
                className="col-span-full py-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-ug-teal hover:text-ug-teal transition-all"
              >
                Reveal {profileMatches.length - 5} More Strategic Collaborators
              </button>
            )}

           {profileMatches.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm text-gray-200">
                   <Users size={40} />
                </div>
                <h4 className="text-sm font-black text-ug-navy mb-2">No Strategic Collaborators Found</h4>
                <p className="text-[10px] font-medium text-gray-400 max-w-md mx-auto leading-relaxed px-10">
                  Your research fingerprint is unique. As more researchers and industry partners join the ecosystem, you'll see high-fidelity matches here. 
                  <br/><br/>
                  <span className="text-ug-teal">Pro-tip: Refine your research summary to improve matching precision.</span>
                </p>

             </div>
           )}
        </div>
      </div>
    </div>
  );
};

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

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-2 lg:col-span-8 space-y-8">
               <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
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

               <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mt-8">
                  <SectionTitle title="Scholarships & Research Fellowships" subtitle="Academically Funded Pathways to Support Innovation" />
                  <div className="space-y-4 mt-6">
                     {[
                        { title: "University of Ghana Research Excellence Grant", provider: "Department of Biochemistry", amount: "GH₵ 25,000 / sem", openTo: "MPhil / MSc", icon: Award },
                        { title: "West African Vaccines Research Fellowship", provider: "Noguchi Medical Research Institute", amount: "GH₵ 40,000 / yr", openTo: "PhD Candidates", icon: Zap },
                        { title: "UG Innovate Technical Mentee Grant", provider: "Institute of Applied Science & Technology", amount: "GH₵ 12,000 / sem", openTo: "BSc Senior Students", icon: BookOpen }
                     ].map((sch, index) => (
                        <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-gray-50 rounded-3xl bg-gray-50/10 hover:bg-white hover:shadow-lg transition gap-4 animate-fade-in-up">
                           <div className="flex gap-4">
                              <div className="w-12 h-12 bg-ug-teal/5 rounded-2xl flex items-center justify-center text-ug-teal shrink-0"><sch.icon size={20} /></div>
                              <div>
                                 <span className="text-[8px] font-black text-ug-teal uppercase tracking-widest mb-1 block">{sch.openTo}</span>
                                 <h4 className="font-black text-ug-navy text-xs leading-snug">{sch.title}</h4>
                                 <p className="text-[8px] font-black text-gray-400 mt-1 uppercase tracking-widest">{sch.provider}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 justify-between md:justify-end">
                              <div className="text-left md:text-right shrink-0">
                                 <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Stipend Amount</span>
                                 <span className="text-xs font-black text-ug-navy">{sch.amount}</span>
                              </div>
                              <button onClick={() => navigate('/projects')} className="bg-ug-navy text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-ug-teal transition">Inquire</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
            <div className="md:col-span-2 lg:col-span-4 space-y-8 border-t lg:border-t-0 pt-8 lg:pt-0">
               {user?.id && <BookmarkedProjectsList userId={user.id} />}
               <HubStreamSidebar />
            </div>
         </div>
      </div>
   );
};

const InvestorDashboard = ({ user }: { user: User | null }) => {
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

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-2 lg:col-span-8 space-y-8">
               <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
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
            <div className="md:col-span-2 lg:col-span-4 space-y-8 border-t lg:border-t-0 pt-8 lg:pt-0">
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
  const [website4, setWebsite4] = useState(user?.website_url_4 || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setWebsite(user.website_url || '');
      setWebsite2(user.website_url_2 || '');
      setWebsite3(user.website_url_3 || '');
      setWebsite4(user.website_url_4 || '');
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
        role: user.role,
        email: user.email,
        website_url: website,
        website_url_2: website2,
        website_url_3: website3,
        website_url_4: website4,
        avatar_url: avatarUrl 
      });
      
      showToast("Profile identity updated", "success");
      onUpdate();
    } catch (err: any) { 
      showToast(`Update failed: ${err.message}`, "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="animate-fade-in space-y-12 pb-24">
      {/* Identity Card */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="relative group">
          <div 
            onClick={handleAvatarClick}
            className="w-40 h-40 md:w-56 md:h-56 rounded-[4rem] overflow-hidden bg-gray-50 border-[12px] border-white shadow-2xl cursor-pointer relative"
          >
            {avatarPreview ? (
              <img src={avatarPreview} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="Avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 bg-ug-navy/5"><UserIcon size={72} strokeWidth={1} /></div>
            )}
            <div className="absolute inset-0 bg-ug-navy/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white backdrop-blur-[4px] gap-2">
              <Camera size={28} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Change Picture</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleAvatarClick}
            className="absolute -bottom-2 -right-2 w-14 h-14 bg-ug-teal text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <Pencil size={24} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
        
        <div className="text-center md:text-left space-y-6 flex-1">
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-ug-navy tracking-tight">{name || 'New Member'}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
              <span className="text-[10px] font-black text-ug-teal uppercase tracking-[0.3em] italic">Official Researcher Profile</span>
              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user?.email}</span>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-500 font-medium max-w-2xl leading-relaxed">
            Update your profile details and personal links to ensure the intelligence engine can match you with the right projects and partners.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <button type="button" onClick={handleAvatarClick} className="px-8 py-4 bg-ug-navy text-white hover:bg-ug-teal transition rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Change Profile Picture</button>
            <div className="px-8 py-4 bg-white text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-100">Status: Verified</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm space-y-14">
            {/* Biography Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-ug-teal/10 text-ug-teal rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                <div>
                  <h4 className="text-xl font-black text-ug-navy tracking-tight uppercase">My Information</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Professional Narrative</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Display Name</label>
                  <input 
                    required type="text" 
                    value={name || ''} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] p-6 font-bold text-ug-navy focus:bg-white focus:border-ug-teal focus:ring-8 focus:ring-ug-teal/5 outline-none transition-all shadow-inner text-lg" 
                    placeholder="Enter your full name..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Short Bio</label>
                  <textarea 
                    rows={8} 
                    value={bio || ''} 
                    onChange={e => setBio(e.target.value)} 
                    className="w-full bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] p-6 font-medium text-gray-600 focus:bg-white focus:border-ug-teal focus:ring-8 focus:ring-ug-teal/5 outline-none resize-none leading-relaxed text-base shadow-inner" 
                    placeholder="Tell us about your expertise, research interests, and goals..." 
                  />
                </div>
              </div>
            </div>

            {/* Portfolio Links */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-ug-navy text-white rounded-2xl flex items-center justify-center shadow-2xl"><LinkIcon size={24} /></div>
                <div>
                  <h4 className="text-xl font-black text-ug-navy tracking-tight uppercase">Portfolio Slots</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">External Research Links (Up to 4)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: "Main Portfolio Website", val: website, setter: setWebsite, placeholder: "https://yourwebsite.com" },
                  { label: "LinkedIn Profile", val: website2, setter: setWebsite2, placeholder: "https://linkedin.com/in/..." },
                  { label: "Research Archive Link", val: website3, setter: setWebsite3, placeholder: "Scholar or Project link" },
                  { label: "Extra Portfolio Slot", val: website4, setter: setWebsite4, placeholder: "Any other relevant link" },
                ].map((input, idx) => (
                  <div key={idx} className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{input.label}</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-ug-teal transition-colors">
                        <LinkIcon size={16} />
                      </div>
                      <input 
                        type="url" 
                        placeholder={input.placeholder}
                        value={input.val || ''} 
                        onChange={e => input.setter(e.target.value)} 
                        className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border-2 border-transparent rounded-[1.5rem] font-bold text-ug-navy focus:bg-white focus:border-ug-teal focus:ring-8 focus:ring-ug-teal/5 outline-none transition-all shadow-inner text-sm" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-8">
              <button 
                type="submit" 
                disabled={loading} 
                className="group w-full md:w-auto bg-ug-navy text-white px-16 py-6 rounded-[1.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:bg-ug-teal transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} className="group-hover:scale-125 transition-transform" />}
                Save My Profile
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="bg-ug-navy text-white p-10 md:p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group/secure">
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover/secure:opacity-10 transition-all duration-1000 rotate-12">
              <ShieldCheck size={240} />
            </div>
            
            <div className="relative z-10 space-y-10">
              <div>
                <h4 className="text-[10px] font-black text-ug-teal uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck size={14} /> Security Hub
                </h4>
                <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">Privacy Controls</h3>
              </div>
              
              <div className="space-y-4">
                <button 
                  type="button" 
                  className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-ug-teal/10 text-ug-teal rounded-xl shadow-lg border border-ug-teal/20"><Lock size={18} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Reset Password</span>
                  </div>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-ug-teal group-hover:translate-x-1 transition" />
                </button>
                
                <button 
                  type="button" 
                  className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shadow-lg border border-blue-500/20"><Eye size={18} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Visibility Mode</span>
                  </div>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                </button>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                 <p className="text-[10px] font-medium text-white/50 leading-relaxed italic">
                   "Your data is used specifically for matchmaking and is never shared with third-party advertisers."
                 </p>
                 <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-ug-success rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-ug-success">Encrypted & Secure</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Administrative</h4>
            <div className="space-y-2">
              <button type="button" className="w-full flex items-center justify-between p-5 hover:bg-gray-50 rounded-2xl transition group text-left border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <Download size={18} className="text-gray-300 group-hover:text-ug-navy transition" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Download Data</span>
                </div>
              </button>
              <button type="button" className="w-full flex items-center justify-between p-5 hover:bg-red-50 rounded-2xl transition group text-left border border-transparent hover:border-red-100">
                <div className="flex items-center gap-4">
                  <Trash2 size={18} className="text-gray-300 group-hover:text-red-500 transition" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-red-600 transition">Delete Account</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Dashboards;
