
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export const EmbeddingService = {
  getEmbedding: async (text: string): Promise<number[]> => {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Using zero vector.");
      return new Array(768).fill(0); 
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      
      if (!result.embedding || !result.embedding.values) return new Array(768).fill(0);
      return result.embedding.values;
    } catch (error) {
      console.error("Embedding generation error:", error);
      return new Array(768).fill(0);
    }
  }
};
