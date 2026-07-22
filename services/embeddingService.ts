import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || '';
};

export const EmbeddingService = {
  // Ensure the embedding is exactly the desired size (default 768)
  ensureDimension: (arr: number[] | null | undefined, dimension = 768): number[] => {
    let vec: number[];
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      vec = new Array(dimension).fill(0.001);
    } else if (arr.length === dimension) {
      vec = arr;
    } else if (arr.length > dimension) {
      vec = arr.slice(0, dimension);
    } else {
      vec = [...arr, ...new Array(dimension - arr.length).fill(0.001)];
    }

    const isZero = vec.every(v => Math.abs(v) < 1e-9);
    if (isZero) {
      return new Array(dimension).fill(0.001);
    }
    return vec;
  },

  getEmbedding: async (text: string): Promise<number[]> => {
    try {
      const apiKey = getApiKey();
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text,
        });
        const resAny = response as any;
        const rawValues = resAny.embedding?.values || resAny.embeddings?.[0]?.values;
        if (rawValues && rawValues.length > 0) {
          return EmbeddingService.ensureDimension(rawValues, 768);
        }
      }
    } catch (error: any) {
      console.warn("Client embedding generation fallback used:", error?.message || error);
    }
    // Fallback vector for compatibility
    return new Array(768).fill(0.001);
  }
};
