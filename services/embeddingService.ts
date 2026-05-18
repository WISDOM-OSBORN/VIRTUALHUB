import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const EmbeddingService = {
  getEmbedding: async (text: string): Promise<number[]> => {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Using zero vector.");
      return new Array(768).fill(0); 
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.embedContent({
        model: "text-embedding-004", // Most stable for matching
        contents: [text],
      });
      
      if (!result.embeddings || result.embeddings.length === 0) return new Array(768).fill(0);
      return result.embeddings[0].values;
    } catch (error) {
      console.error("Embedding generation error:", error);
      return new Array(768).fill(0);
    }
  }
};
