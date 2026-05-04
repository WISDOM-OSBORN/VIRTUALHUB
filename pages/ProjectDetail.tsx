
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Microscope, ShieldCheck, TrendingUp, 
  Users, Bookmark, FileText, CheckCircle2, AlertCircle, Send, Check, Image as ImageIcon,
  Handshake, Lock, Download, Loader2, User as UserIcon, Mail, Building2, ExternalLink, Share2, MessageSquare, X,
  Briefcase, Heart, Lightbulb, FileCode
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Project, ProjectStatus, User } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../App';

// --- CONTACT PI MODAL ---
const ContactPIModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  recipientName: string;
  projectId: string;
}> = ({ isOpen, onClose, recipientName, projectId }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        showToast("Authentication Required. Please log in to connect.", "error");
        setSending(false);
        return;
      }

      let senderName = "Research Partner";
      const profile = await StorageService.getProfile(session.user.id);
      if (profile?.name) senderName = profile.name;

      await StorageService.submitEOI(projectId, senderName, `[DIRECT MESSAGE] ${message}`);
      setSent(true);
      showToast("Message Transmitted to PI", "success");
      setTimeout(() => { setSent(false); setMessage(''); onClose(); }, 2000);
    } catch (err: any) {
      showToast(err.message || "Transmission failed. Check your login status.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ug-navy/80 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-ug-teal"></div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-ug-navy">Connect with PI</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>
        {sent ? (
          <div className="py-12 text-center animate-fade-in">
             <div className="w-16 h-16 bg-ug-success text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-ug-success/20"><Check size={32} /></div>
             <p className="font-black text-ug-navy uppercase tracking-widest text-sm">Dispatched</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</p><p className="font-bold text-ug-navy">{recipientName}</p></div>
            <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your inquiry..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ug-teal/20 font-medium text-gray-700 resize-none"></textarea>
            <button type="submit" disabled={sending} className="w-full bg-[#0092B0] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-ug-navy transition-all">
              {sending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<User | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submittingEOI, setSubmittingEOI] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      StorageService.getProjects().then(data => {
        const found = data.find(p => p.id === id);
        if (found) {
          setProject(found);
          if (found.owner_id) StorageService.getProfile(found.owner_id).then(setOwnerProfile);
          // Increment views
          StorageService.incrementProjectMetric(id, 'views');
        }
      });
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) StorageService.isBookmarked(session.user.id, id).then(setIsBookmarked);
      });
    }
  }, [id]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `UG Hub: ${project?.title}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback(true);
        showToast("Link Copied", "success");
        setTimeout(() => setShareFeedback(false), 2000);
      }
    } catch (e) {}
  };

  const submitFormalInterest = async (type: string) => {
    if (!id) return;
    setSubmittingEOI(type);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        showToast("Session Required. Please log in.", "error");
        setSubmittingEOI(null);
        return;
      }

      let senderName = "Industry Partner";
      const profile = await StorageService.getProfile(session.user.id);
      if (profile?.name) senderName = profile.name;

      await StorageService.submitEOI(id, senderName, `[FORMAL EOI] Submission for ${type}. This partner wishes to engage in ${type.toLowerCase()} regarding this innovation.`, undefined, 'requests');
      showToast(`${type} Interest Recorded`, "success");
    } catch (err: any) {
      showToast(err.message || "Submission failed. Ensure you are signed in.", "error");
    } finally {
      setSubmittingEOI(null);
    }
  };

  const handleDownloadBrief = () => {
    if (project?.technical_details_url) {
      window.open(project.technical_details_url, '_blank', 'noopener,noreferrer');
      showToast("Downloading Technical Disclosure", "info");
    } else {
      showToast("Document not currently published for this record.", "info");
    }
  };

  if (!project) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-ug-teal" size={40} /></div>;

  const images = project.image_url.split('|');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative h-[480px] w-full overflow-hidden">
        <img src={images[0]} alt={project.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ug-navy via-ug-navy/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <button onClick={() => navigate('/projects')} className="text-white/60 hover:text-white flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-[0.2em]"><ArrowLeft size={16} /> Return to Hub</button>
              <div className="flex gap-3 mb-4">
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-ug-navy text-white shadow-xl">Stage {project.trl}</span>
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white backdrop-blur-md border border-white/20">{project.status}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{project.title}</h1>
            </div>
            <div className="flex items-center gap-4 animate-fade-in-up">
              <button onClick={handleShare} className="relative h-[64px] w-[64px] rounded-[18px] bg-white/10 border border-white/20 shadow-lg hover:bg-white/20 transition-all flex items-center justify-center text-white group">
                <Share2 size={24} className="group-hover:scale-110 transition" />
              </button>
              <button onClick={() => setIsContactModalOpen(true)} className="px-10 h-[64px] bg-[#0092B0] hover:bg-[#007C96] rounded-[22px] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95 group relative overflow-hidden border border-white/10">
                <MessageSquare size={20} className="text-white" />
                <span className="text-white font-black text-sm uppercase tracking-widest leading-tight">Connect <br /> with PI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Executive Summary */}
          <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
            <h2 className="text-2xl font-black text-ug-navy mb-6 flex items-center gap-3"><FileText className="text-ug-teal" /> Executive Summary</h2>
            <p className="text-gray-600 leading-relaxed text-xl font-normal" style={{ fontFamily: "'Times New Roman', Times, serif" }}>"{project.description}"</p>
          </section>

          {images[1] && (
            <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-ug-navy mb-6 flex items-center gap-3"><ImageIcon className="text-ug-teal" /> Visual Disclosure</h2>
              <img src={images[1]} alt="Evidence" className="w-full rounded-[2rem] shadow-lg" />
            </section>
          )}

          {project.achievements && project.achievements.length > 0 && (
            <section className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-ug-navy mb-8 flex items-center gap-4">
                <CheckCircle2 className="text-ug-success" size={28} /> Key Milestones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.achievements.map((item, i) => (
                  <div key={i} className="flex items-start gap-5 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="mt-1 text-ug-success"><Check size={18} /></div>
                    <p className="text-gray-600 font-bold leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* PI CARD */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-ug-navy mb-6 flex items-center gap-2"><UserIcon size={20} className="text-ug-teal" /> Lead Investigator</h3>
            {ownerProfile ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-ug-teal/20 shadow-sm"><img src={ownerProfile.avatar_url} className="w-full h-full object-cover" /></div>
                  <div>
                    <h4 className="font-black text-ug-navy text-lg leading-tight">{ownerProfile.name}</h4>
                    <p className="text-[10px] font-black text-ug-teal uppercase tracking-widest mt-1">{ownerProfile.role}</p>
                  </div>
                </div>
                <Link to={`/researcher/${ownerProfile.id}`} className="w-full py-4 bg-ug-navy text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-2 hover:bg-ug-teal transition-all shadow-xl">Access Full Portfolio <ExternalLink size={14} /></Link>
              </div>
            ) : <div className="text-center py-6 text-gray-400 font-bold">Bio Loading...</div>}
          </section>

          {/* DEDICATED DOWNLOAD BLOCK - If Available */}
          {project.technical_details_url && (
            <section className="bg-white p-8 rounded-[2.5rem] border border-ug-teal/30 shadow-lg animate-fade-in-up relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-ug-teal/5 rounded-full blur-2xl group-hover:bg-ug-teal/10 transition-colors"></div>
              <div className="relative z-10">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileCode size={14} className="text-ug-teal" /> Verified Resources
                </h3>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-ug-teal mb-4 group-hover:scale-110 transition-transform">
                    <Download size={32} />
                  </div>
                  <h4 className="font-black text-ug-navy text-sm mb-1">Technical Brief</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-6">PDF Document • {project.research_area}</p>
                  <button 
                    onClick={handleDownloadBrief}
                    className="w-full py-4 bg-ug-teal text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-ug-teal/20 hover:bg-ug-navy transition-all flex items-center justify-center gap-2"
                  >
                    Download Disclosure
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* COMPACT SUBMISSION OF INTEREST BLOCK */}
          <section className="bg-ug-navy p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ug-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-lg font-black mb-1 flex items-center gap-2"><Briefcase className="text-ug-teal" size={20} /> Submission of Interest</h2>
              <p className="text-gray-400 text-[9px] mb-6 font-bold uppercase tracking-widest">Formal partnership track</p>
              
              <div className="flex flex-col gap-3">
                {[
                  { label: "Commercialization", icon: TrendingUp, color: "hover:bg-ug-teal" },
                  { label: "Venture Funding", icon: DollarSign, color: "hover:bg-ug-success" },
                  { label: "Technical Mentorship", icon: Lightbulb, color: "hover:bg-purple-500" }
                ].map((action) => (
                  <button
                    key={action.label}
                    disabled={!!submittingEOI}
                    onClick={() => submitFormalInterest(action.label)}
                    className={`flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl transition-all group ${action.color} disabled:opacity-50`}
                  >
                    <div className="p-2 rounded-xl bg-white/10 text-ug-teal group-hover:text-white transition-colors">
                      {submittingEOI === action.label ? <Loader2 className="animate-spin" size={16} /> : <action.icon size={18} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">Instant portal notification triggered on click.</p>
            </div>
          </section>

          {/* IMPACT SCORING */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
             <h3 className="text-sm font-black text-ug-navy mb-6 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-ug-teal" /> Impact Scoring
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hub Views</span>
                   <span className="text-lg font-black text-ug-navy">{project.views || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expressions of Interest</span>
                   <span className="text-lg font-black text-ug-navy">{project.expressions_of_interest || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formal Requests</span>
                   <span className="text-lg font-black text-ug-navy">{project.requests || 0}</span>
                </div>
                {!project.technical_details_url && (
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={16} className="text-gray-300" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Disclosure restricted</span>
                  </div>
                )}
             </div>
          </section>
        </div>
      </div>
      <ContactPIModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} recipientName={ownerProfile?.name || "PI"} projectId={id!} />
    </div>
  );
};

export default ProjectDetail;
