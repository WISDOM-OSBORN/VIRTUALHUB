
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, AIProfile } from '../types';
import { AIProfileService } from '../services/aiProfileService';
import { StorageService } from '../services/storageService';
import { EmbeddingService } from '../services/embeddingService';
import { 
  Users, GraduationCap, Building, Wallet, 
  ChevronRight, ChevronLeft, Upload, 
  FileText, Check, Loader2, Sparkles,
  Search, Target, Zap, Rocket
} from 'lucide-react';
import { useToast } from '../App';
import { useNavigate } from 'react-router-dom';

interface OnboardingProps {
  user: any;
  onComplete: () => void;
}

type OnboardingStep = 'role' | 'questionnaire' | 'resume' | 'processing' | 'summary';

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<OnboardingStep>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [cvText, setCvText] = useState('');
  const [answers, setAnswers] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<AIProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('questionnaire');
  };

  const handleLookingForToggle = (option: string) => {
    const currentSelections = Array.isArray(answers.looking_for)
      ? answers.looking_for
      : answers.looking_for
        ? [answers.looking_for]
        : [];

    let nextSelections: string[];
    if (currentSelections.includes(option)) {
      nextSelections = currentSelections.filter(item => item !== option);
    } else {
      nextSelections = [...currentSelections, option];
    }

    setAnswers({
      ...answers,
      looking_for: nextSelections
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isPDF = file.type === 'application/pdf' || fileExt === 'pdf';
    const isText = file.type === 'text/plain' || fileExt === 'txt';
    const isDoc = file.type.includes('word') || ['doc', 'docx'].includes(fileExt || '');

    if (!isPDF && !isText && !isDoc) {
      showToast("Please upload a PDF, DOCX or TXT file", "error");
      return;
    }

    setIsUploading(true);
    
    try {
      if (isPDF) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            // Robust dynamic import for pdfjs
            const pdfjsLib = await import('pdfjs-dist');
            // We use a fixed version that matches the package.json
            const pdfjsVersion = '5.7.284'; 
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

            const loadingTask = pdfjsLib.getDocument({ 
              data: arrayBuffer,
              useWorkerFetch: false,
            });

            const pdf = await loadingTask.promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            }

            // Cleanup
            if (fullText.trim().length < 20) {
              throw new Error("Empty extraction");
            }

            setCvText(fullText.trim());
            showToast("Resume parsed successfully", "success");
          } catch (err) {
            console.error("PDF Parse Error:", err);
            showToast("Parsing failed. Please paste text directly into the area below.", "warning");
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCvText(e.target?.result as string);
          setIsUploading(false);
          showToast("Document registered", "success");
        };
        reader.readAsText(file);
      } else {
        setIsUploading(false);
        showToast("Word documents (.docx) cannot be parsed directly. Please paste the text below.", "warning");
      }
    } catch (error) {
      setIsUploading(false);
      showToast("File processing failed", "error");
    }
  };

  const processAIProfile = async () => {
    setIsProcessing(true);
    setStep('processing');
    try {
      const profile = await AIProfileService.processProfile(cvText, {
        ...answers,
        role: selectedRole,
        user_name: user?.name
      });
      
      setExtractedProfile(profile);
      
      // Generate Embedding for matching
      let embedding: number[] | undefined;
      try {
        embedding = await EmbeddingService.getEmbedding(profile.embedding_text);
      } catch (err: any) {
        console.error("Embedding generation failed:", err);
        showToast(err?.message || "AI Vector Matching setup failed due to missing credentials. Using local fallbacks.", "warning");
      }

      // Save to Supabase
      if (user?.id) {
        await StorageService.updateProfile({
          id: user.id,
          role: selectedRole as any,
          ai_profile: profile,
          bio: profile.semantic_summary,
          embedding,
          semantic_summary: profile.semantic_summary,
          answers: answers // Added answers here
        });
      }
      
      setStep('summary');
    } catch (error) {
      showToast("Simulation Error: AI Processing failed. Please try again.", "error");
      setStep('resume');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRoleStep = () => (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-ug-teal/10 text-ug-teal rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <Zap size={40} className="fill-current" />
        </motion.div>
        <h1 className="text-4xl font-black text-ug-navy mb-4 tracking-tighter">Who are you in this ecosystem?</h1>
        <p className="text-gray-500 font-medium">Select your identity to personalize your intelligence hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: UserRole.Student, icon: GraduationCap, label: 'Student', desc: 'Find internships & mentors.' },
          { id: UserRole.Researcher, icon: Users, label: 'Researcher', desc: 'Secure funding & assistants.' },
          { id: UserRole.Investor, icon: Wallet, label: 'Investor', desc: 'Discover high-impact research.' },
          { id: UserRole.IndustryPartner, icon: Building, label: 'Industry', desc: 'Scale solutions & hire talent.' },
        ].map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoleSelect(role.id)}
            className="group bg-white p-8 rounded-[2rem] border-2 border-gray-100 hover:border-ug-teal text-left transition-all shadow-xl shadow-gray-100 hover:shadow-ug-teal/10"
          >
            <div className="w-14 h-14 bg-gray-50 group-hover:bg-ug-teal text-gray-400 group-hover:text-white rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <role.icon size={28} />
            </div>
            <h3 className="text-lg font-black text-ug-navy mb-2 uppercase tracking-wide group-hover:text-ug-teal transition-colors">
              {role.label}
            </h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">{role.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="max-w-2xl mx-auto p-8">
      <button onClick={() => setStep('role')} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-ug-navy font-bold text-xs uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-10">
        <span className="text-xs font-black text-ug-teal uppercase tracking-[0.2em] mb-2 block italic">Step 2 of 4</span>
        <h2 className="text-3xl font-black text-ug-navy tracking-tight">Your Intentions</h2>
        <p className="text-gray-400 text-sm font-medium mt-2 italic">Tell us what you want to achieve today.</p>
      </div>

      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scroll-smooth">
        {/* COMMON QUESTIONS */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Primary Focus</label>
          <input 
            type="text" 
            placeholder="e.g. Molecular Biology, FinTech, Robotics..."
            value={answers.expertise || ''}
            onChange={(e) => setAnswers({...answers, expertise: e.target.value})}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">What are you currently looking for?</label>
          <div className="grid grid-cols-2 gap-3">
            {(selectedRole === UserRole.Researcher 
              ? ['Funding', 'Industry Partner', 'Student Assistants', 'Commercialization'] 
              : selectedRole === UserRole.Student 
              ? ['Internships', 'Mentorship', 'Research Collab', 'Scholarships']
              : selectedRole === UserRole.Investor
              ? ['High-Impact Research', 'Student Startups', 'Patent Portfolios', 'Commercial Ready']
              : ['Skilled Talent', 'Problem Solving', 'Research Funding', 'Joint Ventures']
            ).map(option => {
              const isSelected = Array.isArray(answers.looking_for)
                ? answers.looking_for.includes(option)
                : answers.looking_for === option;
              
              return (
                <button
                  key={option}
                  onClick={() => handleLookingForToggle(option)}
                  className={`py-3 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                    isSelected ? 'bg-ug-navy text-white border-ug-navy' : 'bg-white border-gray-100 text-gray-400 hover:border-ug-teal'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROLE-SPECIFIC QUESTIONS */}
        {selectedRole === UserRole.Student && (
          <div className="space-y-6 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Current Program</label>
              <input 
                type="text" 
                placeholder="e.g. BSc Computer Science"
                value={answers.program || ''}
                onChange={(e) => setAnswers({...answers, program: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Availability</label>
              <select 
                value={answers.availability || ''}
                onChange={(e) => setAnswers({...answers, availability: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold appearance-none"
              >
                <option value="">Select Availability</option>
                <option value="immediate">Immediate</option>
                <option value="next_month">Next Month</option>
                <option value="part_time">Part-time</option>
                <option value="internship_window">Specific Internship Window</option>
              </select>
            </div>
          </div>
        )}

        {selectedRole === UserRole.Researcher && (
          <div className="space-y-6 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Research Stage</label>
              <select 
                value={answers.research_stage || ''}
                onChange={(e) => setAnswers({...answers, research_stage: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold appearance-none"
              >
                <option value="">Select Stage</option>
                <option value="conceptual">Conceptual / Literature Review</option>
                <option value="prototype">Active Prototyping</option>
                <option value="validation">Clinical / Market Validation</option>
                <option value="scaling">Ready for Commercial Scaling</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-4 bg-ug-teal/5 rounded-2xl border border-ug-teal/10">
              <input 
                type="checkbox" 
                id="needs_funding"
                checked={!!answers.funding_needed}
                onChange={(e) => setAnswers({...answers, funding_needed: e.target.checked})}
                className="w-5 h-5 rounded-lg border-2 border-ug-teal text-ug-teal focus:ring-ug-teal"
              />
              <label htmlFor="needs_funding" className="text-xs font-black text-ug-navy uppercase tracking-widest cursor-pointer">Seeking External Funding</label>
            </div>
          </div>
        )}

        {selectedRole === UserRole.Investor && (
          <div className="space-y-6 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Funding Range (USD)</label>
              <select 
                value={answers.funding_range || ''}
                onChange={(e) => setAnswers({...answers, funding_range: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold appearance-none"
              >
                <option value="">Select Range</option>
                <option value="seed">Seed: $10k - $50k</option>
                <option value="pre_a">Pre-Series A: $50k - $250k</option>
                <option value="growth">Growth: $250k+</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Investment Focus</label>
              <input 
                type="text" 
                placeholder="e.g. Biotech, AI, Agri-tech"
                value={answers.investment_focus || ''}
                onChange={(e) => setAnswers({...answers, investment_focus: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold"
              />
            </div>
          </div>
        )}

        {selectedRole === UserRole.IndustryPartner && (
          <div className="space-y-6 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Industry Sector</label>
              <input 
                type="text" 
                placeholder="e.g. Manufacturing, Logistics, Retail"
                value={answers.sector || ''}
                onChange={(e) => setAnswers({...answers, sector: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block italic">Preferred Collaboration</label>
              <select 
                value={answers.collab_type || ''}
                onChange={(e) => setAnswers({...answers, collab_type: e.target.value})}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-sm font-bold appearance-none"
              >
                <option value="">Select Type</option>
                <option value="internship">Internship Programs</option>
                <option value="research">Sponsored Research</option>
                <option value="advisory">Advisory & Mentorship</option>
                <option value="licensing">Technology Licensing</option>
              </select>
            </div>
          </div>
        )}

        <button 
          onClick={() => setStep('resume')}
          className="w-full bg-ug-navy text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-ug-navy/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
        >
          Next Step <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderResumeStep = () => (
    <div className="max-w-2xl mx-auto p-8">
      <button onClick={() => setStep('questionnaire')} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-ug-navy font-bold text-xs uppercase tracking-widest transition-colors text-gradient-to-r">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-10">
        <span className="text-xs font-black text-ug-teal uppercase tracking-[0.2em] mb-2 block">Step 3 of 4</span>
        <h2 className="text-3xl font-black text-ug-navy tracking-tight">Experience Import</h2>
        <p className="text-gray-400 text-sm font-medium mt-2 italic">Upload your CV or paste your bio for AI matching.</p>
      </div>

      <div className="space-y-8">
        <div className="relative group">
          <input 
            type="file" 
            id="cv-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
          />
          <label 
            htmlFor="cv-upload"
            className={`w-full aspect-video border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              cvText ? 'bg-ug-teal/5 border-ug-teal' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`p-6 rounded-3xl ${cvText ? 'bg-ug-teal text-white' : 'bg-white text-gray-300 shadow-sm'} transition-colors`}>
              {isUploading ? <Loader2 className="animate-spin" size={32} /> : (cvText ? <Check size={32} /> : <Upload size={32} />)}
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-ug-navy uppercase tracking-widest">
                {isUploading ? 'Extracting Data...' : (cvText ? 'Payload Registered' : 'Drop CV / Resume')}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF, DOCX, or Text</p>
            </div>
          </label>
        </div>

        <div className="text-center">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Or paste content below</span>
        </div>

        <textarea 
          placeholder="Paste CV text or a detailed bio here..."
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          className="w-full h-48 bg-gray-50 border-2 border-gray-100 rounded-[2rem] p-8 outline-none focus:bg-white focus:border-ug-teal transition-all text-xs font-medium leading-relaxed resize-none shadow-inner"
        />

        <button 
          onClick={processAIProfile}
          disabled={!cvText && !answers.expertise}
          className="w-full bg-ug-navy text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-ug-navy/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          Initialize Intelligence <Sparkles size={18} />
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12">
      <div className="relative mb-12">
        <div className="w-32 h-32 border-4 border-ug-teal/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="text-ug-teal animate-spin" size={64} />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -inset-8 bg-ug-teal/10 rounded-full blur-3xl z-[-1]"
        />
      </div>
      <h2 className="text-3xl font-black text-ug-navy tracking-tighter mb-4 animate-bounce">Generating Digital Twin...</h2>
      <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] max-w-sm mx-auto leading-loose italic">
        Normalizing research datasets, classifying technical competencies, and identifying optimal ecosystem nodes.
      </p>
    </div>
  );

  const renderSummary = () => (
    <div className="max-w-4xl mx-auto p-12">
      <div className="flex flex-col md:flex-row gap-12 items-start">
        <div className="flex-1">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="px-4 py-2 bg-ug-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                {extractedProfile?.role}
              </div>
              <div className="px-4 py-2 bg-ug-teal text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                {extractedProfile?.experience_level}
              </div>
            </div>
            <h1 className="text-5xl font-black text-ug-navy tracking-tighter mb-6 leading-none">
                Intelligence Extraction <span className="text-ug-teal">Complete.</span>
            </h1>
            <p className="text-gray-500 font-medium leading-relaxed italic text-lg">
                "{extractedProfile?.semantic_summary}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Technical Assets</h4>
              <div className="flex flex-wrap gap-2">
                {[...(extractedProfile?.skills?.technical_skills || []), ...(extractedProfile?.skills?.tools_and_technologies || [])].slice(0, 10).map(s => (
                  <span key={s} className="px-3 py-1.5 bg-gray-50 rounded-lg text-[9px] font-bold text-gray-600 uppercase border border-gray-100">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Strategic Intent</h4>
              <div className="flex flex-wrap gap-2">
                {(extractedProfile?.collaboration_profile?.looking_for || []).map(l => (
                  <span key={l} className="px-3 py-1.5 bg-ug-teal/10 rounded-lg text-[9px] font-bold text-ug-teal uppercase border border-ug-teal/20">{l}</span>
                ))}
              </div>
            </div>
          </div>

          {(extractedProfile?.work_experience?.length || 0) > 0 && (
            <div className="mb-12">
              <h4 className="text-[10px] font-black text-ug-teal uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={14} /> Professional Trajectory
              </h4>
              <div className="space-y-4">
                {extractedProfile?.work_experience?.slice(0, 2).map((exp, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-black text-ug-navy uppercase">{exp.role} @ {exp.organization}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{exp.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(extractedProfile?.projects?.length || 0) > 0 && (
            <div className="mb-12">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Rocket size={14} /> Ecosystem Initiatives
              </h4>
              <div className="space-y-4">
                {extractedProfile?.projects?.slice(0, 2).map((p, i) => (
                  <div key={i} className="border-l-2 border-gray-100 pl-4">
                    <p className="text-xs font-bold text-ug-navy mb-1">{p.project_name}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={onComplete}
            className="w-full md:w-auto bg-ug-navy text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-ug-navy/40 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            Enter Dashboard <Rocket size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
            <h4 className="text-[10px] font-black text-ug-navy uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Digital Identity</h4>
            <div className="space-y-6">
                {[
                    { label: 'Education', val: extractedProfile?.education?.[0]?.degree, icon: GraduationCap },
                    { label: 'Role', val: extractedProfile?.professional_profile?.professional_title, icon: Target },
                    { label: 'Experience', val: extractedProfile?.professional_profile?.experience_level, icon: Zap },
                ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"><item.icon size={18}/></div>
                        <div>
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{item.label}</p>
                            <p className="text-[11px] font-bold text-ug-navy uppercase tracking-tight">{item.val || 'N/A'}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-ug-navy overflow-x-hidden selection:bg-ug-teal/20">
      {/* Background elements */}
      <div className="fixed top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-ug-teal/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="px-8 py-10 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
            <div className="bg-ug-navy p-2 rounded-2xl text-white shadow-xl shadow-ug-navy/20">
                <GraduationCap size={24} />
            </div>
            <span className="font-black tracking-[0.3em] uppercase text-sm">UG Hub</span>
        </div>
        <div className="flex items-center gap-10">
            <div className="hidden md:flex gap-2">
                {['role', 'questionnaire', 'resume', 'summary'].map((s, i) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-700 ${
                        ['role', 'questionnaire', 'resume', 'summary'].indexOf(step) >= i ? 'w-12 bg-ug-teal' : 'w-4 bg-gray-100'
                    }`} />
                ))}
            </div>
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-ug-navy font-black text-[10px] uppercase tracking-widest transition-colors">Abort</button>
        </div>
      </header>
      
      <main className="relative z-10 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {step === 'role' && renderRoleStep()}
            {step === 'questionnaire' && renderQuestionnaire()}
            {step === 'resume' && renderResumeStep()}
            {step === 'processing' && renderProcessing()}
            {step === 'summary' && renderSummary()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
