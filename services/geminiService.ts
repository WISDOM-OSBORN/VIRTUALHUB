import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || '';
};

export const getGeminiResponse = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Hello! I am the UG Virtual Industry Hub Assistant. (Tip: Add your VITE_GEMINI_API_KEY to your environment variables for live Gemini AI responses). How can I assist you with research projects, innovation disclosures, or industry partnerships today?";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Format conversation history
    const contents = [
      ...history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: "You are the AI Research & Innovation Assistant for the University of Ghana Virtual Industry Hub. Provide helpful, accurate, concise, and professional guidance on academic research, tech transfer, industry challenges, and collaborations in West Africa."
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return "I am currently experiencing connection issues or invalid API configuration. Please try again later.";
  }
};
