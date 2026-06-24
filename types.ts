
export enum UserRole {
  Student = 'Student',
  Researcher = 'Researcher',
  Investor = 'Investor',
  IndustryPartner = 'Industry/Partner',
  Admin = 'Admin'
}

export enum ProjectStatus {
  Concept = 'Concept',
  ProofOfConcept = 'Proof of Concept',
  Prototype = 'Prototype Development',
  Validation = 'Validation Stage',
  Commercialization = 'Commercialization-Ready',
  MarketReady = 'Market-Ready'
}

export enum Visibility {
  Draft = 'Draft',
  Internal = 'Internal',
  Public = 'Public',
  Private = 'Internal'
}

export enum DisclosureStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  PendingReview = 'Pending Review',
  DocumentsRequested = 'Documents Requested',
  EditsRequested = 'Edits Requested',
  UnderReReview = 'Under Re-Review',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Published = 'Published'
}

export enum ResearchArea {
  Diagnostics = 'Diagnostics Tools & Systems',
  Pharmaceutical = 'Pharmaceutical',
  Vaccines = 'Vaccines'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  user_type?: 'individual' | 'entity';
  department?: string;
  company?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  website_url_2?: string;
  website_url_3?: string;
  website_url_4?: string;
  ai_profile?: any;
  answers?: any;
  embedding?: number[];
  semantic_summary?: string;
  created_at?: string;
  
  // Joined role-specific profile fields
  education_level?: string;
  availability?: string;
  looking_for?: string;
  program?: string;
  research_stage?: string;
  funding_needed?: string;
  needs_students?: boolean;
  funding_range?: string;
  investment_focus?: string;
  sector?: string;
  collaboration_type?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  department: string;
  status: ProjectStatus;
  visibility: Visibility;
  trl: number; 
  research_area: ResearchArea;
  image_url: string; 
  budget: string;
  start_date: string;
  owner_id?: string;
  created_at?: string;
  
  funding_amount_usd?: string;
  open_to_collaboration?: boolean;
  technical_details_url?: string;
  achievements?: string[];
  needs?: string[];
  views?: number;
  expressions_of_interest?: number;
  requests?: number;
  embedding?: number[];
  
  // New Disclosure management fields
  disclosure_status?: DisclosureStatus;
  internal_notes?: string;
  requested_documents?: { id: string; name: string; requested_at: string; status: 'requested' | 'uploaded'; url?: string; uploaded_at?: string; by?: string }[];
  disclosure_timeline?: { event: string; user_name: string; timestamp: string; details?: string }[];
  ai_verification?: {
    summary?: string;
    risk_score?: number;
    recommended_action?: string;
    verified_at?: string;
    evidence?: string[];
    missing_evidence?: string[];
  };
}

export interface AIProfile {
  personal_information: {
    full_name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    linkedin: string;
    github: string;
    portfolio_website: string;
  };
  professional_profile: {
    professional_title: string;
    current_role: string;
    institution_or_company: string;
    years_of_experience: string;
    experience_level: string;
  };
  education: {
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_year: string;
    gpa?: string;
  }[];
  skills: {
    technical_skills: string[];
    research_skills: string[];
    business_skills: string[];
    soft_skills: string[];
    tools_and_technologies: string[];
  };
  work_experience: {
    role: string;
    organization: string;
    duration: string;
    location: string;
    responsibilities: string[];
    achievements: string[];
  }[];
  research_information: {
    research_interests: string[];
    research_areas: string[];
    research_keywords: string[];
    methodologies: string[];
    research_domains: string[];
  };
  projects: {
    project_name: string;
    description: string;
    technologies_used: string[];
    industry: string;
    impact?: string;
    commercialization_potential?: string;
  }[];
  publications: {
    title: string;
    year: string;
    keywords: string[];
    research_domain: string;
    publication_type: string;
  }[];
  certifications: string[];
  industries: string[];
  startup_and_innovation_signals: {
    startup_experience: boolean;
    prototype_built: boolean;
    patents: string[];
    commercial_research: boolean;
    market_validation: boolean;
    entrepreneurial_interests: string[];
  };
  collaboration_profile: {
    looking_for: string[];
    can_offer: string[];
    preferred_collaboration_types: string[];
    availability: string;
    preferred_regions: string[];
  };
  investment_and_funding_profile: {
    seeking_funding: boolean;
    investment_interests: string[];
    funding_stage: string;
    estimated_budget_needs: string;
    target_industries: string[];
  };
  student_profile: {
    internship_interests: string[];
    career_goals: string[];
    preferred_industries: string[];
    learning_interests: string[];
  };
  semantic_tags: string[];
  semantic_summary: string;
  embedding_text: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  published_at: string;
  image_url: string;
  summary: string;
  external_url?: string;
  is_ai_generated?: boolean;
  source_name?: string;
}
