import { supabase } from '../lib/supabase';

export const EmbeddingService = {
  // Ensure the embedding is exactly the desired size (default 768)
  ensureDimension: (arr: number[] | null | undefined, dimension = 768): number[] => {
    if (!arr || !Array.isArray(arr)) {
      return new Array(dimension).fill(0);
    }
    if (arr.length === dimension) {
      return arr;
    }
    if (arr.length > dimension) {
      return arr.slice(0, dimension);
    }
    return [...arr, ...new Array(dimension - arr.length).fill(0)];
  },

  getEmbedding: async (text: string): Promise<number[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/gemini/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawValues = data.embedding;

      if (!rawValues) {
        throw new Error("No numerical embedding values found in Gemini API response.");
      }

      return EmbeddingService.ensureDimension(rawValues, 768);
    } catch (error: any) {
      console.error("Embedding generation error:", error);
      console.warn("Falling back to zero vector for match compatibility.");
      return new Array(768).fill(0);
    }
  }
};
