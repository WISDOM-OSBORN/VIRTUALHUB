
export enum UserRole {
  Researcher = 'Researcher',
  Student = 'Student',
  Partner = 'Partner',
  Industry = 'Industry'
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
  Public = 'Public'
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
  department?: string;
  company?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  website_url_2?: string;
  website_url_3?: string;
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
  
  funding_amount_usd?: string;
  open_to_collaboration?: boolean;
  technical_details_url?: string;
  achievements?: string[];
  needs?: string[];
  views?: number;
  expressions_of_interest?: number;
  requests?: number;
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
