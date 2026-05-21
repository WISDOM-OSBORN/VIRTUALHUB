
import Groq from "groq-sdk";
import { AIProfile } from "../types";

const groqApiKey = (import.meta as any).env.VITE_GROQ_API_KEY || (import.meta as any).env.VITE_GROQ_API || 'NOT_SET';

const groq = new Groq({ 
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true 
});

const SYSTEM_PROMPT = `
You are a High-Precision Profile Extraction Agent for the University of Ghana Virtual Industry Hub.
Your objective is to transform unstructured text (CVs/Resumes) and role-specific questionnaire responses into a high-fidelity, machine-readable JSON profile.

CORE ROLES:
1. STUDENT: Focus on learning, projects, internships, and career goals.
2. RESEARCHER: Focus on research areas, TRL levels, publications, and funding needs.
3. INVESTOR: Focus on sectors, ticket size (funding range), and portfolio interests.
4. INDUSTRY/PARTNER: Focus on business sectors, talent needs, and collaboration models (e.g., sponsored research).

MAPPING LOGIC:
- If User is INVESTOR: populate 'investment_and_funding_profile' with their sector and range.
- If User is STUDENT: populate 'student_profile' and 'education'.
- If User is RESEARCHER: populate 'research_information' and 'projects' with TRL context.
- If User is INDUSTRY/PARTNER: populate 'industries' and 'collaboration_profile'.

OUTPUT SCHEMA (STRICT JSON):
{
  "personal_information": {
    "full_name": "", "email": "", "phone": "", "country": "", "city": "", "linkedin": "", "github": "", "portfolio_website": ""
  },
  "professional_profile": {
    "professional_title": "", "current_role": "", "institution_or_company": "", "years_of_experience": "", "experience_level": "beginner|intermediate|advanced"
  },
  "education": [
    { "institution": "", "degree": "", "field_of_study": "", "graduation_year": "", "gpa": "" }
  ],
  "skills": {
    "technical_skills": [], "research_skills": [], "business_skills": [], "soft_skills": [], "tools_and_technologies": []
  },
  "work_experience": [
    { "role": "", "organization": "", "duration": "", "location": "", "responsibilities": [], "achievements": [] }
  ],
  "research_information": {
    "research_interests": [], "research_areas": [], "research_keywords": [], "methodologies": [], "research_domains": []
  },
  "projects": [
    { "project_name": "", "description": "", "technologies_used": [], "industry": "", "impact": "", "commercialization_potential": "" }
  ],
  "publications": [
    { "title": "", "year": "", "keywords": [], "research_domain": "", "publication_type": "" }
  ],
  "certifications": [],
  "industries": [],
  "startup_and_innovation_signals": {
    "startup_experience": false, "prototype_built": false, "patents": [], "commercial_research": false, "market_validation": false, "entrepreneurial_interests": []
  },
  "collaboration_profile": {
    "looking_for": [], "can_offer": [], "preferred_collaboration_types": [], "availability": "", "preferred_regions": []
  },
  "investment_and_funding_profile": {
    "seeking_funding": false, "investment_interests": [], "funding_stage": "", "estimated_budget_needs": "", "target_industries": []
  },
  "student_profile": {
    "internship_interests": [], "career_goals": [], "preferred_industries": [], "learning_interests": []
  },
  "semantic_tags": [],
  "semantic_summary": "",
  "embedding_text": ""
}

Respond with JSON ONLY. Ensure all arrays/objects are present even if empty.
`;

export const AIProfileService = {
  processProfile: async (cvText: string = "", questionnaire: any = {}): Promise<AIProfile> => {
    if (!groqApiKey || groqApiKey === 'NOT_SET') {
      throw new Error(`GROQ_API_KEY_ERROR: No valid API key found. 
      Please ensure you have a secret named "VITE_GROQ_API_KEY" in your settings.`);
    }

    // Truncate CV text if it's massive to avoid token limit issues
    const truncatedCv = (cvText || "").slice(0, 20000);

    const userPrompt = `
      EXTRACT AND MERGE PROFILE DATA INTO SYSTEM SCHEMA:
      
      SOURCE 1: CV / RESUME TEXT
      <CV_START>
      ${truncatedCv}
      <CV_END>

      SOURCE 2: QUESTIONNAIRE RESPONSES
      <JSON_START>
      ${JSON.stringify(questionnaire)}
      <JSON_END>

      IMPORTANT INSTRUCTIONS FOR SEMANTIC FIELDS:
      1. 'semantic_summary': 2-3 sentences max. Example: "AI researcher from Ghana specializing in computer vision and agriculture technology. Experienced in machine learning, IoT systems, and crop disease detection. Interested in commercialization, climate-tech innovation, and investor partnerships."
      2. 'embedding_text': A concatenated string of (semantic_summary + skills + research_interests + industries + goals/looking_for). This will be used for vector embeddings.
      3. Ensure 'skills' are categorized correctly into technical, research, business, etc.

      Return ONLY the minimized JSON object.
    `;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const profileData = JSON.parse(responseText);
      return profileData as AIProfile;
    } catch (error) {
      console.error("AI Profile Processing Error:", error);
      throw error;
    }
  }
};
