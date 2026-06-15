import { AIProfile } from "../types";

export const AIProfileService = {
  processProfile: async (cvText: string = "", questionnaire: any = {}): Promise<AIProfile> => {
    try {
      const response = await fetch('/api/ai-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cvText,
          questionnaire,
          userType: 'individual'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("AI Profile API Proxy Error:", error);
      throw error;
    }
  },

  processEntityProfile: async (answers: any): Promise<AIProfile> => {
    try {
      const response = await fetch('/api/ai-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cvText: "",
          questionnaire: answers,
          userType: 'entity'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error("AI Entity Profile Synthesis API Proxy Error:", error);
      throw error;
    }
  }
};
