
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
      let completion;
      try {
        completion = await groq.chat.completions.create({
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
      } catch (firstErr: any) {
        const errMsg = firstErr?.message || "";
        if (errMsg.includes("429") || errMsg.includes("rate") || errMsg.includes("limit")) {
          console.warn("Llama-3.3-70b-versatile rate limit reached in processProfile. Falling back to llama-3.1-8b-instant...");
          completion = await groq.chat.completions.create({
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
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            max_tokens: 3000,
            temperature: 0.1,
          });
        } else {
          throw firstErr;
        }
      }

      const responseText = completion.choices[0]?.message?.content || "{}";
      const profileData = JSON.parse(responseText);
      return profileData as AIProfile;
    } catch (error) {
      console.error("AI Profile Processing Error:", error);
      throw error;
    }
  },

  processEntityProfile: async (answers: any): Promise<AIProfile> => {
    if (!groqApiKey || groqApiKey === 'NOT_SET') {
      throw new Error(`GROQ_API_KEY_ERROR: No valid API key found. 
      Please ensure you have a secret named "VITE_GROQ_API_KEY" in your settings.`);
    }

    const prompt = `
      You are an elite AI Profile Synthesizer for the University of Ghana Virtual Industry Hub.
      Your goal is to parse answers from an organization (NGO, Private Company, Investor, Venture Fund, Startup, Healthcare Provider, etc.) questionnaire and synthesize a cohesive machine-readable, schema-compliant JSON AIProfile profile.
      
      Here are the survey responses from the organization:
      ${JSON.stringify(answers, null, 2)}
      
      Please synthesize:
      1. A high-quality professional semantic summary (2-3 sentences max). Describe the organization type, what they offer, who they seek to collaborate with, and what major problems they are solving.
      2. Keywords (semantic_tags) and a comprehensive embedding_text string containing a condensed text representation of their entire profile for vector alignment.
      3. Skills divided into 'technical_skills', 'research_skills', 'business_skills', etc. Use capabilityVector and focus sectors to build these lists.
      4. Standard collaboration fields.

      OUTPUT SCHEMA REQUIRED (Strict JSON conforming to our standard AIProfile format):
      {
        "personal_information": {
          "full_name": "${answers.orgName || ''}",
          "email": "${answers.contactEmail || ''}",
          "phone": "${answers.contactPhone || ''}",
          "country": "Ghana",
          "city": "${answers.location || ''}",
          "linkedin": "",
          "github": "",
          "portfolio_website": "${answers.website || ''}"
        },
        "professional_profile": {
          "professional_title": "${answers.role === 'Investor' ? 'Investor' : 'Industry Partner'}",
          "current_role": "${answers.orgType || ''}",
          "institution_or_company": "${answers.orgName || ''}",
          "years_of_experience": "Established",
          "experience_level": "advanced"
        },
        "education": [],
        "skills": {
          "technical_skills": ${JSON.stringify(answers.capabilityVector || [])},
          "research_skills": ${JSON.stringify(answers.sectorVector || [])},
          "business_skills": ${JSON.stringify(answers.offerVector || [])},
          "soft_skills": ["Project Management", "Ecosystem Collaboration"],
          "tools_and_technologies": ${JSON.stringify(answers.capabilityVector || [])}
        },
        "work_experience": [],
        "research_information": {
          "research_interests": ${JSON.stringify(answers.sectorVector || [])},
          "research_areas": ${JSON.stringify(answers.sectorVector || [])},
          "research_keywords": ${JSON.stringify(answers.sectorVector || [])},
          "methodologies": [],
          "research_domains": ${JSON.stringify(answers.sectorVector || [])}
        },
        "projects": [],
        "publications": [],
        "certifications": [],
        "industries": ${JSON.stringify(answers.sectorVector || [])},
        "startup_and_innovation_signals": {
          "startup_experience": ${answers.orgType === 'Startup'},
          "prototype_built": ${JSON.stringify(answers.readinessVector || []).includes('Prototype')},
          "patents": [],
          "commercial_research": true,
          "market_validation": ${JSON.stringify(answers.readinessVector || []).includes('Market')},
          "entrepreneurial_interests": []
        },
        "collaboration_profile": {
          "looking_for": ${JSON.stringify(answers.needVector || [])},
          "can_offer": ${JSON.stringify(answers.offerVector || [])},
          "preferred_collaboration_types": ${JSON.stringify(answers.collaborationVector || [])},
          "availability": "immediate",
          "preferred_regions": []
        },
        "investment_and_funding_profile": {
          "seeking_funding": ${answers.role !== 'Investor' && JSON.stringify(answers.needVector || []).includes('Funding')},
          "investment_interests": ${JSON.stringify(answers.sectorVector || [])},
          "funding_stage": "${answers.fundingStage ? answers.fundingStage.join(', ') : ''}",
          "estimated_budget_needs": "${answers.investmentRange || ''}",
          "target_industries": ${JSON.stringify(answers.sectorVector || [])}
        },
        "student_profile": {
          "internship_interests": [],
          "career_goals": [],
          "preferred_industries": [],
          "learning_interests": []
        },
        "semantic_tags": [],
        "semantic_summary": "",
        "embedding_text": ""
      }
      
      CRITICAL INSTRUCTIONS:
      - Improve and synthesize the 'semantic_summary' with 2-3 engaging, expert-sounding sentences. Avoid generic lists. Make it sound highly professional.
      - Generate 'semantic_tags' from their focus area and capabilities, including custom user-specified answers.
      - Make sure the output is strict, valid JSON. Only return the JSON object. No extra words, greetings, or backticks outside the json.
    `;

    try {
      let completion;
      try {
        completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional research matching and profile extraction AI. You respond strictly in valid JSON format matching the specified schema." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          max_tokens: 2550,
          temperature: 0.2
        });
      } catch (firstErr: any) {
        const errMsg = firstErr?.message || "";
        if (errMsg.includes("429") || errMsg.includes("rate") || errMsg.includes("limit")) {
          console.warn("Llama-3.3-70b-versatile rate limit reached in processEntityProfile. Falling back to llama-3.1-8b-instant...");
          completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: "You are a professional research matching and profile extraction AI. You respond strictly in valid JSON format matching the specified schema." },
              { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            max_tokens: 2550,
            temperature: 0.2
          });
        } else {
          throw firstErr;
        }
      }

      const responseText = completion.choices[0]?.message?.content || "{}";
      const profileData = JSON.parse(responseText);
      return profileData as AIProfile;
    } catch (e) {
      console.error("AI Entity Profile Synthesis Error:", e);
      return {
        personal_information: {
          full_name: answers.orgName || 'Ecosystem Entity',
          email: answers.contactEmail || '',
          phone: answers.contactPhone || '',
          country: 'Ghana',
          city: answers.location || '',
          linkedin: '',
          github: '',
          portfolio_website: answers.website || ''
        },
        professional_profile: {
          professional_title: answers.role === 'Investor' ? 'Investor' : 'Industry Partner',
          current_role: answers.orgType || 'Organization',
          institution_or_company: answers.orgName || 'Ecosystem Entity',
          years_of_experience: 'Established',
          experience_level: 'advanced'
        },
        education: [],
        skills: {
          technical_skills: answers.capabilityVector || [],
          research_skills: answers.sectorVector || [],
          business_skills: answers.offerVector || [],
          soft_skills: [],
          tools_and_technologies: answers.capabilityVector || []
        },
        work_experience: [],
        research_information: {
          research_interests: answers.sectorVector || [],
          research_areas: answers.sectorVector || [],
          research_keywords: [],
          methodologies: [],
          research_domains: answers.sectorVector || []
        },
        projects: [],
        publications: [],
        certifications: [],
        industries: answers.sectorVector || [],
        startup_and_innovation_signals: {
          startup_experience: answers.orgType === 'Startup',
          prototype_built: false,
          patents: [],
          commercial_research: true,
          market_validation: false,
          entrepreneurial_interests: []
        },
        collaboration_profile: {
          looking_for: answers.needVector || [],
          can_offer: answers.offerVector || [],
          preferred_collaboration_types: answers.collaborationVector || [],
          availability: 'immediate',
          preferred_regions: []
        },
        investment_and_funding_profile: {
          seeking_funding: false,
          investment_interests: answers.sectorVector || [],
          funding_stage: answers.fundingStage ? answers.fundingStage.join(', ') : '',
          estimated_budget_needs: answers.investmentRange || '',
          target_industries: answers.sectorVector || []
        },
        student_profile: {
          internship_interests: [],
          career_goals: [],
          preferred_industries: [],
          learning_interests: []
        },
        semantic_tags: answers.sectorVector || [],
        semantic_summary: `${answers.orgName || 'Ecosystem Entity'} is a ${answers.orgType || 'partner'} based in ${answers.location || 'Ghana'}. Focuses on ${answers.sectorVector?.join(', ') || 'innovative solutions'}. Offers ${answers.offerVector?.slice(0, 3).join(', ') || 'collaboration'} and is looking for ${answers.needVector?.slice(0, 3).join(', ') || 'partners'}.`,
        embedding_text: `${answers.orgName} organization focus areas: ${answers.sectorVector?.join(', ')}. Capabilities: ${answers.capabilityVector?.join(', ')}. Offers: ${answers.offerVector?.join(', ')}. Needs: ${answers.needVector?.join(', ')}.`
      };
    }
  }
};
