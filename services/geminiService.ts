
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Standardizing SDK usage: fresh client initialization and direct process.env access
export const getGeminiResponse = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  
  try {
    // Initializing with the named parameter apiKey as per requirements.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Using gemini-3.1-pro-preview for complex research hub reasoning tasks.
    const model = 'gemini-3.1-pro-preview';
    const systemInstruction = `You are the Virtual Assistant for the University of Ghana (UG) Industry Hub. 
    Your goal is to help researchers, students, and industry partners connect.
    You know about:
    - Research Projects (Diagnostics, Pharmaceutical, Vaccines)
    - TRL (Technology Readiness Levels)
    - Partnerships
    
    Be professional, academic yet accessible, and helpful. Keep answers concise (under 150 words) unless asked for detail.`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history
    });

    // sendMessage handles the user turn; response text is accessed via the .text property.
    const result: GenerateContentResponse = await chat.sendMessage({ message: message });
    return result.text || "I'm sorry, I couldn't generate a response.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently experiencing high traffic or a connection issue. Please try again later.";
  }
};
