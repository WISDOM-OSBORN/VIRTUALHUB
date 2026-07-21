import { AIProfile } from '../types';
import { supabase } from '../lib/supabase';

const API_BASE_URL = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');

export const MatchingService = {
  rankMatches: async (userProfile: AIProfile, candidateMatches: any[]) => {
    if (!candidateMatches.length) return [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/ai-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userProfile,
          candidateMatches
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rankings = data.rankings || [];

      // Sort and merge: Match by unique UUID first, then fall back to indices
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
      console.error("AI Ranking failed, falling back to vector similarity scores:", error);
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
  }
};
