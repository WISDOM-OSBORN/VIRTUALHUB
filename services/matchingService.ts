
import { Groq } from 'groq-sdk';
import { StorageService } from './storageService';
import { User, AIProfile } from '../types';

export const MatchingService = {
  rankMatches: async (userProfile: AIProfile, candidateMatches: any[]) => {
    if (!candidateMatches.length) return [];

    const groqApiKey = (import.meta as any).env.VITE_GROQ_API_KEY || (import.meta as any).env.VITE_GROQ_API || '';

    if (!groqApiKey || groqApiKey === 'NOT_SET') {
      console.warn("VITE_GROQ_API_KEY is missing or NOT_SET. Falling back to default database semantic similarity scores.");
      return candidateMatches.map(c => {
        const simScore = typeof c.similarity === 'number' && !isNaN(c.similarity) ? Math.round(c.similarity * 100) : 75;
        return {
          ...c,
          ai_score: simScore,
          ai_reasoning: "Matched based on profile semantic vector alignment.",
          ai_label: "Semantic Match"
        };
      }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }

    const prompt = `
      You are an elite AI Matching Engine for the University of Ghana Research Hub.
      Your task is to re-rank potential matches based on specific weighted factors.

      MATCHING CRITERIA & WEIGHTS:
      1. Skills Overlap (25%): technical and research competencies.
      2. Intent Compatibility (25%): what they are looking for vs what they offer.
      3. Interests Similarity (20%): research domains and industries.
      4. Project/Industry Alignment (20%): sectors and current initiatives.
      5. Logistics (10%): location and collaboration preferences.

      USER PROFILE:
      - Role: ${userProfile.professional_profile.current_role}
      - Title: ${userProfile.professional_profile.professional_title}
      - Summary: ${userProfile.semantic_summary}
      - Looking For: ${userProfile.collaboration_profile.looking_for.join(', ')}
      - Can Offer: ${userProfile.collaboration_profile.can_offer.join(', ')}
      - Technical Skills: ${userProfile.skills.technical_skills.join(', ')}
      - Research Interests: ${userProfile.research_information.research_interests.join(', ')}

      CANDIDATE MATCHES:
      ${candidateMatches.map((c, i) => `
      [Match #${i}]
      - Unique UUID: ${c.id}
      - Type: ${c.role || (c.title ? 'Project' : 'Unknown')}
      - Title/Name: ${c.name || c.title}
      - Role: ${c.role || 'Project/Initiative'}
      - Summary: ${c.semantic_summary || c.description}
      - Similarity Score: ${c.similarity}
      `).join('\n')}

      INSTRUCTIONS:
      1. Normalize all scores to a 0-100 scale.
      2. For every match provided, give an objective assessment.
      3. For each match, provide:
         - A "reasoning" (2 sentences) explaining the strategic fit based on the weights.
         - A "score" (number between 0 and 100).
         - An "alignment_label" (e.g., "Highly Compatible", "Strategic Match", "Potential Overlay").
      
      OUTPUT FORMAT:
      Return a JSON object with a "rankings" array containing objects exactly like this:
      {
        "id": "match_uuid_from_above",
        "index": original_index_number,
        "score": number,
        "reasoning": "reasoning string",
        "alignment_label": "alignment label"
      }
    `;

    try {
      const groq = new Groq({
        apiKey: groqApiKey,
        dangerouslyAllowBrowser: true,
      });

      let response;
      try {
        response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a professional research matching AI. Respond strictly in JSON format matching the specified schema." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
      } catch (firstErr: any) {
        const errorMsg = firstErr?.message || "";
        if (errorMsg.includes("429") || errorMsg.includes("rate") || errorMsg.includes("limit")) {
          console.warn("Llama-3.3-70b-versatile rate limit hit. Falling back to llama-3.1-8b-instant...");
          response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are a professional research matching AI. Respond strictly in JSON format matching the specified schema." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          });
        } else {
          throw firstErr;
        }
      }

      const responseText = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(responseText);
      const rankings = result.rankings || result.matches || [];

      // Sort and merge: Match by unique UUID first, then fall back to indexes (strict or loose)
      return candidateMatches.map((c, i) => {
        const ranking = rankings.find((r: any) => {
          if (!r) return false;
          // Match by UUID
          const uuidMatch = r.id && c.id && String(r.id).toLowerCase() === String(c.id).toLowerCase();
          // Match by Index (loose string/number)
          const indexMatch = (r.index !== undefined && Number(r.index) === i) || 
                             (r.id !== undefined && Number(r.id) === i) ||
                             (r.id !== undefined && String(r.id) === String(i));
          return uuidMatch || indexMatch;
        });

        const fallbackScore = typeof c.similarity === 'number' && !isNaN(c.similarity) ? Math.round(c.similarity * 100) : 75;
        const finalScore = ranking && typeof ranking.score === 'number' && !isNaN(ranking.score) ? ranking.score : fallbackScore;

        return {
          ...c,
          ai_score: finalScore,
          ai_reasoning: ranking?.reasoning || "Semantic similarity indicates strong research alignment.",
          ai_label: ranking?.alignment_label || "AI Identified Match"
        };
      }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    } catch (error) {
      console.error("AI Ranking failed completely:", error);
      return candidateMatches.map(c => {
        const simScore = typeof c.similarity === 'number' && !isNaN(c.similarity) ? Math.round(c.similarity * 100) : 75;
        return {
          ...c,
          ai_score: simScore,
          ai_reasoning: "Semantic match based on vector alignment.",
          ai_label: "Semantic Match"
        };
      }).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }
  }
};
