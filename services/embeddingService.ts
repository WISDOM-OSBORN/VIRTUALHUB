import { GoogleGenAI } from "@google/genai";

// Deep helper to find any floating point array in the API response
const findFirstNumericalArray = (obj: any): number[] | undefined => {
  if (!obj) return undefined;
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'number') {
      return obj;
    }
    for (const item of obj) {
      const found = findFirstNumericalArray(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    if (obj.values && Array.isArray(obj.values) && typeof obj.values[0] === 'number') {
      return obj.values;
    }
    if (obj.embedding && Array.isArray(obj.embedding) && typeof obj.embedding[0] === 'number') {
      return obj.embedding;
    }
    for (const key of Object.keys(obj)) {
      try {
        const found = findFirstNumericalArray(obj[key]);
        if (found) return found;
      } catch (e) {
        // Prevent accessor error
      }
    }
  }
  return undefined;
};

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
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    
    if (!key) {
      const errMsg = "GEMINI_API_KEY is missing. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your settings.";
      console.error(errMsg);
      throw new Error(errMsg);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [text],
        outputDimensionality: 768,
      } as any);
      
      const rawValues = findFirstNumericalArray(result);

      if (!rawValues) {
        throw new Error("No numerical embedding values found in Gemini API response.");
      }

      return EmbeddingService.ensureDimension(rawValues, 768);
    } catch (error: any) {
      console.error("Embedding generation error:", error);
      // Re-throw if it is a credential error to let the UI react loudly
      if (error.message?.includes("API_KEY") || error.message?.includes("key")) {
        throw error;
      }
      // Fallback only if it is a transient/parsing issue, but log the warning clearly
      console.warn("Falling back to zero vector for match compatibility.");
      return new Array(768).fill(0);
    }
  }
};

