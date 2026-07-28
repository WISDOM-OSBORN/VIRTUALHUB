import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

const getApiKey = () => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || '';
};

export const DocumentExtractionService = {
  extractAndAnalyze: async (fileBase64: string, fileName: string, _mimeType: string) => {
    try {
      let rawText = '';
      const binaryString = atob(fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          rawText = result.value || '';
        } catch (mErr) {
          console.warn("Mammoth extraction warning, falling back to text decoding:", mErr);
          const decoder = new TextDecoder('utf-8');
          rawText = decoder.decode(bytes);
        }
      } else {
        const decoder = new TextDecoder('utf-8');
        rawText = decoder.decode(bytes);
      }

      const apiKey = getApiKey();
      if (apiKey && rawText.trim()) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Analyze this research/news document draft from University of Ghana:
Document Text:
${rawText.substring(0, 4000)}

Extract structured JSON with keys:
{
  "title": "Clear headline/title",
  "summary": "2-3 sentence concise executive summary",
  "category": "Diagnostics Tools & Systems",
  "tags": ["research", "innovation"],
  "source_verification_notes": "Verified from document ${fileName}"
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            return { success: true, data: parsed };
          }
        } catch (e) {
          console.warn("Client Gemini doc extraction fallback used:", e);
        }
      }

      // Basic client-side text extraction fallback
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const title = lines[0] ? lines[0].substring(0, 120) : fileName.replace(/\.[^/.]+$/, "");
      const summary = lines.slice(1, 4).join(' ').substring(0, 300) || "Extracted content from document for University of Ghana Virtual Industry Hub.";

      return {
        success: true,
        data: {
          title,
          summary,
          category: "Diagnostics Tools & Systems",
          tags: ["research", "innovation", "ug-hub"],
          source_verification_notes: `Parsed from ${fileName}`
        }
      };
    } catch (e: any) {
      console.error("Document extraction service error:", e);
      return {
        success: false,
        error: e.message || "Failed to extract text from document."
      };
    }
  }
};
