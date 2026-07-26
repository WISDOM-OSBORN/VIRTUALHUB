import { AIProfile } from '../types';
import { GoogleGenAI } from '@google/genai';

const getApiKey = () => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || '';
};

// High-speed in-memory rank cache
const rankCache = new Map<string, any[]>();

export const MatchingService = {
  clearCache: () => {
    rankCache.clear();
  },

  rankMatches: async (userProfile: AIProfile, candidateMatches: any[]) => {
    if (!candidateMatches || !candidateMatches.length) return [];

    // Cache lookup
    const candIds = candidateMatches.map(c => c.id).sort().join(',');
    const cacheKey = `${userProfile.semantic_summary?.substring(0, 40) || 'default'}_${candIds}`;
    
    if (rankCache.has(cacheKey)) {
      return rankCache.get(cacheKey)!;
    }

    let result: any[] = [];

    const apiKey = getApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
You are an AI Matching Engine for the University of Ghana Research Hub.
Re-rank these potential candidates/projects for the current user profile based on research relevance, skills overlap, and collaboration goals.

USER PROFILE:
- Title/Role: ${userProfile.professional_profile?.current_role || ''}
- Summary: ${userProfile.semantic_summary || ''}
- Looking For: ${(userProfile.collaboration_profile?.looking_for || []).join(', ')}
- Technical Skills: ${(userProfile.skills?.technical_skills || []).join(', ')}

CANDIDATES:
${candidateMatches.slice(0, 15).map((c: any, i: number) => `
[Candidate #${i}]
- ID: ${c.id}
- Name/Title: ${c.name || c.title}
- Summary/Role: ${c.semantic_summary || c.role || ''}
- Skills/Description: ${(c.skills || []).join(', ')} ${c.description || ''}
`).join('\n')}

Return strictly a JSON array of objects with schema:
[
  {
    "id": "candidate_id",
    "index": 0,
    "score": 88,
    "reasoning": "Direct research synergy in diagnostics and health innovation.",
    "alignment_label": "Highly Compatible"
  }
]
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 1000
          }
        });

        if (response.text) {
          const rankings = JSON.parse(response.text);
          if (Array.isArray(rankings)) {
            result = candidateMatches.map((c, i) => {
              const ranking = rankings.find((r: any) => 
                (r.id && c.id && String(r.id).toLowerCase() === String(c.id).toLowerCase()) ||
                (r.index !== undefined && Number(r.index) === i)
              );

              const simScore = typeof c.similarity === 'number' && !isNaN(c.similarity) ? Math.round(c.similarity * 100) : 75;
              const finalScore = ranking && typeof ranking.score === 'number' ? ranking.score : simScore;

              return {
                ...c,
                ai_score: finalScore,
                ai_reasoning: ranking?.reasoning || "Semantic similarity indicates strong research alignment.",
                ai_label: ranking?.alignment_label || "AI Identified Match"
              };
            }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

            rankCache.set(cacheKey, result);
            return result;
          }
        }
      } catch (err) {
        console.warn("Client Gemini ranking fallback used:", err);
      }
    }

    // High-precision client-side keyword and similarity scoring fallback
    result = candidateMatches.map((c: any) => {
      const titleText = (c.name || c.title || '').toLowerCase();
      const descText = (c.semantic_summary || c.description || '').toLowerCase();
      const userSummary = (userProfile.semantic_summary || '').toLowerCase();
      const userLooking = (userProfile.collaboration_profile?.looking_for || []).join(' ').toLowerCase();

      const keywords = ['diagnostic', 'vaccine', 'malaria', 'pharma', 'student', 'investor', 'research', 'funding', 'partner', 'cancer', 'health'];
      let overlapCount = 0;
      keywords.forEach(kw => {
        const inUser = userSummary.includes(kw) || userLooking.includes(kw);
        const inCandidate = titleText.includes(kw) || descText.includes(kw);
        if (inUser && inCandidate) overlapCount++;
      });

      const similarityBonus = typeof c.similarity === 'number' && !isNaN(c.similarity) ? Math.round(c.similarity * 80) : 65;
      const score = Math.max(50, Math.min(98, similarityBonus + (overlapCount * 8)));

      let alignment_label = "Compatible Match";
      if (score >= 85) alignment_label = "Highly Compatible";
      else if (score >= 70) alignment_label = "Strategic Match";

      const candType = c.role || (c.title ? 'Project' : 'Entity');
      const overlappingFields = keywords.filter(kw => (titleText.includes(kw) || descText.includes(kw)));
      const matchesStr = overlappingFields.length > 0 ? overlappingFields.slice(0, 2).join(' & ') : 'academic technologies';
      const reasoning = `Matches on joint parameters including ${matchesStr}. Strategic alignment indicates key structural synergies with this ${candType}.`;

      return {
        ...c,
        ai_score: score,
        ai_reasoning: reasoning,
        ai_label: alignment_label
      };
    }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    rankCache.set(cacheKey, result);
    return result;
  }
};
