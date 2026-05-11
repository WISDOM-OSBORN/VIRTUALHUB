
import { Groq } from 'groq-sdk';
import { StorageService } from './storageService';
import { User, AIProfile } from '../types';

const groq = new Groq({
  apiKey: (import.meta as any).env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const MatchingService = {
  rankMatches: async (userProfile: AIProfile, candidateMatches: any[]) => {
    if (!candidateMatches.length) return [];

    const prompt = `
      You are an elite AI Matching Engine for the University of Ghana Research Hub.
      Your task is to re-rank the following potential matches based on the user's research profile, skills, and collaboration intent.

      USER PROFILE:
      - Title: ${userProfile.professional_profile.professional_title}
      - Summary: ${userProfile.semantic_summary}
      - Looking For: ${userProfile.collaboration_profile.looking_for.join(', ')}
      - Expertise: ${userProfile.skills.technical_skills.join(', ')}

      CANDIDATE MATCHES:
      ${candidateMatches.map((c, i) => `
      [Match #${i}]
      - Type: ${c.role ? 'Researcher' : 'Project'}
      - Title/Name: ${c.name || c.title}
      - Summary: ${c.semantic_summary || c.description}
      - Similarity Score: ${c.similarity}
      `).join('\n')}

      INSTRUCTIONS:
      1. Rank the matches from most compatible to least compatible.
      2. For each match, provide:
         - A "Reasoning" explaining why this is a good fit.
         - A "Strength" score (0-100).
         - An "Alignment" keyword (e.g., "Highly Compatible", "Strategic Match", "Skill Overlay").
      
      OUTPUT FORMAT:
      Return a JSON array of objects with keys: id (the original candidate index), score, reasoning, alignment_label.
    `;

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional research matching AI. Respond strictly in JSON format." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const rankings = result.rankings || result.matches || [];

      // Sort and merge
      return candidateMatches.map((c, i) => {
        const ranking = rankings.find((r: any) => r.id === i || r.index === i);
        return {
          ...c,
          ai_score: ranking?.score || Math.round(c.similarity * 100),
          ai_reasoning: ranking?.reasoning || "Semantic similarity indicates potential project alignment.",
          ai_label: ranking?.alignment_label || "AI Identified Match"
        };
      }).sort((a, b) => b.ai_score - a.ai_score);

    } catch (error) {
      console.error("AI Ranking failed:", error);
      return candidateMatches.map(c => ({
        ...c,
        ai_score: Math.round(c.similarity * 100),
        ai_reasoning: "Semantic match based on vector alignment.",
        ai_label: "Semantic Match"
      })).sort((a, b) => b.ai_score - a.ai_score);
    }
  }
};
