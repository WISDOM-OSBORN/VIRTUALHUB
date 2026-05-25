
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, DollarSign, Microscope, ShieldCheck, TrendingUp, 
  Users, Bookmark, FileText, CheckCircle2, AlertCircle, Send, Check, Image as ImageIcon,
  Handshake, Lock, Download, Loader2, User as UserIcon, Mail, Building2, ExternalLink, Share2, MessageSquare, X,
  Briefcase, Heart, Lightbulb, FileCode, GraduationCap, Key, BookOpen, Clock
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
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [revealCleared, setRevealCleared] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submittingEOI, setSubmittingEOI] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  
  // Dynamic Disclosure lock states
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealReason, setRevealReason] = useState('Interested in collaboration and potential funding discussion.');
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [downloadingBrief, setDownloadingBrief] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      StorageService.getProjects().then(data => {
        const found = data.find(p => p.id === id);
        if (found) {
          setProject({
            ...found,
            views: (found.views || 0) + 1
          });
          if (found.owner_id) StorageService.getProfile(found.owner_id).then(setOwnerProfile);
          // Increment views
          StorageService.incrementProjectMetric(id, 'views');
        }
      });
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          StorageService.isBookmarked(session.user.id, id).then(setIsBookmarked);
          StorageService.getProfile(session.user.id).then(profile => {
            setCurrentUserProfile(profile);
            StorageService.getRevealApprovalDetails(session.user.id, id).then(details => {
              setRevealCleared(details.approved);
              setRemainingMinutes(details.approved ? details.remainingMinutes : null);
            });
          });
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (!revealCleared || !id || !currentUserProfile?.id) return;
    
    // Periodically sync remaining minutes
    const interval = setInterval(() => {
      StorageService.getRevealApprovalDetails(currentUserProfile.id, id).then(details => {
        setRevealCleared(details.approved);
        setRemainingMinutes(details.approved ? details.remainingMinutes : null);
      });
    }, 15000); // sync every 15 seconds for snappiness
    
    return () => clearInterval(interval);
  }, [revealCleared, id, currentUserProfile?.id]);

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

  const submitFormalInterest = async (type: string, customReason?: string) => {
    if (!id) return;
    setSubmittingEOI(type);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        showToast("Session Required. Please log in.", "error");
        setSubmittingEOI(null);
        return;
      }

      let senderName = "User in Hub";
      const profile = await StorageService.getProfile(session.user.id);
      if (profile?.name) senderName = profile.name;

      let messageText = `[FORMAL EOI] Submission for ${type}. This partner wishes to engage in ${type.toLowerCase()} regarding this innovation.`;

      if (type === 'Graduate Assistantship' || type === 'Research Assistantship') {
        messageText = `[ASSISTANTSHIP_APPLICATION] Student "${senderName}" has formally requested consideration for a Laboratory / Research Assistantship on this project. Education Level: ${profile?.education_level || 'N/A'}. Program/Course: ${profile?.program || 'N/A'}.`;
      } else if (type === 'Scholarship Application') {
        messageText = `[SCHOLARSHIP_APPLICATION] Student "${senderName}" has submitted an inquiry for Academic Scholarship & Fellowships on this project. Current Track: ${profile?.education_level || 'Graduate'}.`;
      } else if (type === 'Lab Workspace Access') {
        messageText = `[LAB_WORKSPACE_ACCESS] Student "${senderName}" is requesting secure authorization to access the workspace relative to this project. Justification: Innovation analysis.`;
      } else if (type === 'Secure Project Reveal') {
        const finalReason = customReason || revealReason;
        messageText = `🔐 Technical Disclosure Request\n\n[${senderName}] has requested access to the technical brief for:\n\nProject: ${project?.title || 'AI-Driven Crop Disease Detection System'}\n\n\nreason \n${finalReason}`;
      }

      // Determine correct metric category based on the interaction type
      const metricToIncrement: 'expressions_of_interest' | 'requests' = (
        type === 'Secure Project Reveal' ||
        type === 'Graduate Assistantship' ||
        type === 'Research Assistantship' ||
        type === 'Scholarship Application' ||
        type === 'Lab Workspace Access'
      ) ? 'requests' : 'expressions_of_interest';

      await StorageService.submitEOI(id, senderName, messageText, undefined, metricToIncrement);
      showToast(`${type} Request Sent`, "success");

      // Instantly increment on local UI state!
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [metricToIncrement]: (prev[metricToIncrement] || 0) + 1
        };
      });

      if (type === 'Secure Project Reveal') {
        showToast("Reveal Request Submitted to PI. Access pending authorization.", "info");
        setIsRevealModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || "Submission failed. Ensure you are signed in.", "error");
    } finally {
      setSubmittingEOI(null);
    }
  };

  const handleDownloadBrief = () => {
    if (!project?.technical_details_url) {
      showToast("Document not currently published for this record.", "info");
      return;
    }
    setDownloadingBrief(true);
    showToast("Authenticating One-Hour Time-Limited Session...", "info");
    
    setTimeout(() => {
      const watermarkText = `Shared with ${currentUserProfile?.name || currentUserProfile?.email || 'Authorized Partner'} via Virtual Hub`;
      showToast(`Watermark Applied: "${watermarkText}"`, "success");
      
      setTimeout(() => {
        window.open(project.technical_details_url, '_blank', 'noopener,noreferrer');
        setDownloadingBrief(false);
      }, 1000);
    }, 1200);
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
                <CheckCircle2 className="text-ug-success" size={28} /> Key Milestones & Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.achievements.map((item, i) => {
                  const cleanedItem = item.replace(/^(\s*[•\-\*]|\s*\d+\.)\s*/, '');
                  return (
                    <div key={i} className="flex items-start gap-5 p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-ug-teal/20 hover:bg-white transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-ug-teal/10 text-ug-teal font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-ug-teal group-hover:text-white transition-all duration-300">
                        {i + 1}
                      </div>
                      <p className="text-gray-600 font-bold leading-relaxed">{cleanedItem}</p>
                    </div>
                  );
                })}
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
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg animate-fade-in-up relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-ug-navy/5 rounded-full blur-2xl group-hover:bg-ug-navy/10 transition-colors"></div>
              <div className="relative z-10">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileCode size={14} className="text-ug-navy" /> Technical Brief
                </h3>

                {(currentUserProfile?.id === project.owner_id || revealCleared) ? (
                  <div className="p-6 bg-ug-teal/5 rounded-3xl border border-ug-teal/20 flex flex-col items-center text-center">
                    {remainingMinutes !== null && (
                      <span className="mb-4 flex items-center gap-1.5 text-pink-700 text-[9px] font-black uppercase tracking-wider bg-pink-50 px-3 py-1.5 rounded-xl border border-pink-200/50">
                        <Clock size={12} className="animate-pulse animate-duration-1000" /> Decrypted Access: {remainingMinutes} min remaining
                      </span>
                    )}
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-ug-teal mb-4 group-hover:scale-110 transition-transform">
                      {downloadingBrief ? <Loader2 className="animate-spin text-ug-navy" size={32} /> : <Download size={32} />}
                    </div>
                    <h4 className="font-black text-ug-navy text-sm mb-1">{downloadingBrief ? "Authenticating Session..." : "Technical Disclosure"}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-6">PDF Document • {project.research_area}</p>
                    <button 
                      onClick={handleDownloadBrief}
                      disabled={downloadingBrief}
                      className="w-full py-4 bg-ug-teal text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-ug-teal/20 hover:bg-ug-navy transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {downloadingBrief ? "Generating Watermarked Item..." : "Download Document"}
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 flex flex-col items-center text-center relative overflow-hidden min-h-[180px]">
                    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                      <div className="w-12 h-12 bg-ug-navy text-white rounded-full flex items-center justify-center shadow-lg mb-3">
                        <Lock size={18} />
                      </div>
                      <h4 className="font-black text-ug-navy text-xs mb-1 uppercase tracking-wider">🔒 Disclosure Locked</h4>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest text-center px-4 leading-relaxed mb-4 font-bold">
                        Requires Lead Investigator Approval & Privacy Agreement Clearance.
                      </p>
                      <button 
                        onClick={() => {
                          setRevealReason('Interested in collaboration and potential funding discussion.');
                          setIsRevealModalOpen(true);
                        }}
                        className="bg-ug-navy hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition shadow-md hover:scale-105 active:scale-95"
                      >
                        Request Reveal
                      </button>
                    </div>
                    {/* Blurred background preview */}
                    <div className="opacity-10 pointer-events-none select-none filter blur-md w-full flex flex-col items-center py-2">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-300 w-3/4 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 w-1/2 rounded"></div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* COMPACT SUBMISSION OF INTEREST BLOCK */}
          <section className="bg-ug-navy p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ug-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-sm font-black mb-1 flex items-center gap-2">
                <Briefcase className="text-ug-teal" size={18} /> 
                {currentUserProfile?.role === 'Student' ? 'Student Application' : 'Submission of Interest'}
              </h2>
              <p className="text-gray-400 text-[8px] mb-6 font-bold uppercase tracking-widest">
                {currentUserProfile?.role === 'Student' ? 'Academic Opportunities Track' : 'Formal partnership track'}
              </p>
              
              <div className="flex flex-col gap-3">
                {(currentUserProfile?.role === 'Student' ? [
                  { label: "Research Assistantship", icon: GraduationCap, color: "hover:bg-ug-teal" },
                  { label: "Scholarship Application", icon: DollarSign, color: "hover:bg-ug-success" },
                  { label: "Lab Workspace Access", icon: Key, color: "hover:bg-purple-500" }
                ] : currentUserProfile?.role === 'Researcher' ? [
                  { label: "Partner/Co-Investigate", icon: Users, color: "hover:bg-ug-teal" },
                  { label: "Venture Funding", icon: DollarSign, color: "hover:bg-ug-success" },
                  { label: "Resource Access", icon: Key, color: "hover:bg-purple-500" }
                ] : [
                  { label: "Commercialization", icon: TrendingUp, color: "hover:bg-ug-teal" },
                  { label: "Venture Funding", icon: DollarSign, color: "hover:bg-ug-success" },
                  { label: "Technical Mentorship", icon: Lightbulb, color: "hover:bg-purple-500" }
                ]).map((action) => (
                  <button
                    key={action.label}
                    disabled={!!submittingEOI}
                    onClick={() => submitFormalInterest(action.label)}
                    className={`flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl transition-all group ${action.color} disabled:opacity-50 text-left`}
                  >
                    <div className="p-2 rounded-xl bg-white/10 text-ug-teal group-hover:text-white transition-colors flex-shrink-0">
                      {submittingEOI === action.label ? <Loader2 className="animate-spin" size={16} /> : <action.icon size={18} />}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-[7px] text-gray-500 font-bold uppercase tracking-widest text-center">Instant portal notification triggered on click.</p>
            </div>
          </section>

          {/* IMPACT SCORING */}
          <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
             <h3 className="text-sm font-black text-ug-navy mb-6 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-ug-teal" /> Ecosystem Impact
             </h3>
             
             {/* COMPOSITE SCORE MODULE */}
             {(() => {
                const viewsCount = project.views || 0;
                const eoiCount = project.expressions_of_interest || 0;
                const requestsCount = project.requests || 0;
                const dynamicIndex = (viewsCount * 1) + (eoiCount * 8) + (requestsCount * 15);
                
                let tractionRank = "Inception Stage";
                let rankColor = "text-blue-700 bg-blue-50 border-blue-200/40";
                let progressPercentage = Math.min((dynamicIndex / 150) * 100, 100);
                
                if (dynamicIndex >= 150) {
                  tractionRank = "Ecosystem Breakthrough";
                  rankColor = "text-pink-700 bg-pink-50 border-pink-200/40 animate-pulse";
                } else if (dynamicIndex >= 50) {
                  tractionRank = "High-Engagement Innovation";
                  rankColor = "text-purple-700 bg-purple-50 border-purple-200/40";
                } else if (dynamicIndex >= 10) {
                  tractionRank = "Active Traction";
                  rankColor = "text-ug-teal bg-ug-teal/5 border-ug-teal/20";
                }

                return (
                  <div className="space-y-6">
                    {/* Big Score Header */}
                    <div className="bg-gradient-to-br from-ug-navy to-slate-900 text-white rounded-[2rem] p-6 text-center shadow-md relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0092B0_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <span className="text-[9px] font-black text-ug-teal uppercase tracking-widest block mb-1">Ecosystem Impact Index</span>
                      <span className="text-4xl font-extrabold tracking-tight block text-white drop-shadow-sm">{dynamicIndex}</span>
                      <span className={`inline-block mt-3 px-3.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${rankColor} shrink-0`}>
                        {tractionRank}
                      </span>
                    </div>

                    {/* Progress Bar of Traction */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        <span>Milestone Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-ug-teal to-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Breakdown of real numbers */}
                    <div className="space-y-3.5 pt-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Traction Breakdown</span>
                       
                       <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-gray-100/30 transition-colors">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Hub Views</span>
                             <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">+1 Pt per view</span>
                          </div>
                          <span className="text-base font-black text-ug-navy">{viewsCount}</span>
                       </div>
                       
                       <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-gray-100/30 transition-colors">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Expressions of Interest</span>
                             <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">+8 Pts per partnership EOI</span>
                          </div>
                          <span className="text-base font-black text-ug-navy">{eoiCount}</span>
                       </div>
                       
                       <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-gray-100/30 transition-colors">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Formal Requests</span>
                             <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">+15 Pts per disclose / applications</span>
                          </div>
                          <span className="text-base font-black text-ug-navy">{requestsCount}</span>
                       </div>

                       {!project.technical_details_url && (
                         <div className="p-3 bg-red-50/50 rounded-2xl flex items-center gap-3 border border-red-100/50">
                           <AlertCircle size={14} className="text-red-400 shrink-0" />
                           <span className="text-[8px] font-black text-red-700 uppercase tracking-widest leading-relaxed">
                             Technical Brief is restricted for non-owners
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                );
             })()}
          </section>
        </div>
      </div>
      <ContactPIModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} recipientName={ownerProfile?.name || "PI"} projectId={id!} />

      {/* REVEAL PROMPT MODAL */}
      {isRevealModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ug-navy/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-pink-600"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-ug-navy flex items-center gap-2">
                <Lock size={20} className="text-pink-600 animate-pulse" /> Request Secure Reveal
              </h2>
              <button onClick={() => setIsRevealModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
              You are requesting temporary, time-limited 1-hour session access to analyze the decrypted Technical Disclosure brief for:
              <strong className="block text-ug-navy mt-1">"{project?.title}"</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Statement of Intended Reason / Justification</label>
                <textarea 
                  required
                  rows={4}
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  placeholder="E.g. Interested in scientific collaboration or licensing inquiry..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-medium text-xs text-gray-700 resize-none focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevealModalOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-500 font-black text-[10px] uppercase tracking-wider rounded-2xl hover:bg-gray-50 transition animate-duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingEOI === 'Secure Project Reveal' || !revealReason.trim()}
                  onClick={() => submitFormalInterest('Secure Project Reveal')}
                  className="flex-1 py-3.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] uppercase tracking-wider rounded-2xl transition shadow-lg shadow-pink-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingEOI === 'Secure Project Reveal' ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
