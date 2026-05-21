
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem, ProjectStatus } from "../types";
import { StorageService } from "./storageService";
import { supabase } from "../lib/supabase";

/**
 * AI Research Scout Service
 * Targets University of Ghana (UG) domains + Global Accredited Health Platforms
 */

const UG_SOURCES = [
  "https://rid.ug.edu.gh/news",
  "https://orid1.ug.edu.gh/news/",
  "https://www.noguchimedres.org/",
  "https://waccbip.ug.edu.gh/news-events/news",
  "https://biotech.ug.edu.gh/",
  "https://dig.ug.edu.gh/",
  "https://www.iast.ug.edu.gh/",
  "https://www.ug.edu.gh/academics/centres-institutes",
  "https://www.ug.edu.gh/chs/medical-school",
  "https://ugmedicalcentre.org/",
  "https://chs.ug.edu.gh/",
  "https://pharmacy.ug.edu.gh/",
  "https://sbahs.ug.edu.gh/",
  "https://bcmb.ug.edu.gh/",
  "https://microbiology.ug.edu.gh/",
  "https://immunology.ug.edu.gh/",
  "https://caw.ug.edu.gh/",
  "https://csd.ug.edu.gh/",
  "https://rips.ug.edu.gh/",
  "https://isser.ug.edu.gh/",
  "https://ug.edu.gh/ugiep"
];

const GLOBAL_ACCREDITED = [
  "WHO (World Health Organization)",
  "FDA (U.S. Food and Drug Administration)",
  "Nature Medicine Journal",
  "The Lancet Infectious Diseases",
  "GAVI Vaccine Alliance"
];

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export const AIScoutService = {
  getLastSyncTime: async (): Promise<Date | null> => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return null;
      return new Date(data[0].created_at);
    } catch (e) {
      return null;
    }
  },

  /**
   * Automatically synchronizes news.
   * force: if true, ignores the 6-hour cooldown.
   */
  autoSyncNews: async (force: boolean = false): Promise<boolean> => {
    try {
      if (!force) {
        const { data: latestItems, error: fetchError } = await supabase
          .from('news')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!fetchError && latestItems && latestItems.length > 0) {
          const lastSyncTime = new Date(latestItems[0].created_at).getTime();
          if (Date.now() - lastSyncTime < SYNC_INTERVAL_MS) {
            return false; 
          }
        }
      }

      console.log("AI Scout: Initializing multi-model research sync...");
      const scoutedNews = await AIScoutService.scoutGlobalTrends();
      const internalItems = await AIScoutService.aggregateInternalMarketReady();
      const allNewItems = [...scoutedNews, ...internalItems];

      if (allNewItems.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        const payload = allNewItems.map(item => ({
          title: item.title,
          category: item.category,
          summary: item.summary,
          image_url: item.image_url,
          published_at: item.published_at || today,
          external_url: item.external_url,
          is_ai_generated: !!item.is_ai_generated,
          source_name: item.source_name
        }));

        // Upsert by title to avoid duplicates
        const { error: upsertError } = await supabase
          .from('news')
          .upsert(payload, { onConflict: 'title' });

        if (upsertError) {
          if (upsertError.code === '42501') {
            console.error("AI Scout RLS VIOLATION: The Supabase 'news' table has Row-Level Security enabled but no policy exists to allow INSERT/UPDATE. Please run the SQL fix.");
          }
          throw upsertError;
        }
        
        console.log("AI Scout: Sync complete. Images generated and stored.");
        return true;
      }

      return false;
    } catch (error) {
      console.error("AI Scout Critical Failure:", error);
      return false;
    }
  },

  scoutGlobalTrends: async (): Promise<NewsItem[]> => {
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
      if (!apiKey) {
        const errMsg = "AI Scout: GEMINI_API_KEY is missing. AI News Scouting and image generation will be skipped. Please add GEMINI_API_KEY or VITE_GEMINI_API_KEY in your settings.";
        console.error(errMsg);
        throw new Error(errMsg);
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const sitesPrompt = UG_SOURCES.join(", ");
      const globalPrompt = GLOBAL_ACCREDITED.join(", ");
      
      // Step 1: Extract news data and visual descriptions
      const researchResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Act as a Lead Intelligence Scout for the University of Ghana.
        Find 4 RECENT breakthroughs in Medicines, Vaccines, or Diagnostics.
        
        For each news item, you MUST write a highly detailed 'visual_prompt'. 
        The visual_prompt should describe a professional, 3D hyper-realistic medical illustration or high-tech lab photo representing the breakthrough.
        
        Sources: ${sitesPrompt}
        Global context: ${globalPrompt}
        
        Output: JSON array of objects (title, category, summary, source_name, external_url, visual_prompt).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                summary: { type: Type.STRING },
                source_name: { type: Type.STRING },
                external_url: { type: Type.STRING },
                visual_prompt: { type: Type.STRING }
              },
              required: ["title", "category", "summary", "source_name", "external_url", "visual_prompt"]
            }
          }
        }
      });

      if (!researchResponse.text) return [];
      const rawScoutedData = JSON.parse(researchResponse.text.trim());
      const finalizedItems: NewsItem[] = [];
      const today = new Date().toISOString().split('T')[0];

      // Step 2: Generate bespoke images for each news item
      for (let i = 0; i < rawScoutedData.length; i++) {
        const item = rawScoutedData[i];
        console.log(`AI Scout: Painting illustration for headline: ${item.title}`);
        
        try {
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ 
                text: `Professional, cinematic, high-quality medical illustration for: ${item.visual_prompt}. 
                Style: Hyper-realistic 3D render, clean white laboratory background, blue and teal lighting, shallow depth of field, 8k resolution.` 
              }]
            },
            config: {
              imageConfig: { aspectRatio: "16:9" }
            }
          });

          let base64Image = '';
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              base64Image = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }

          finalizedItems.push({
            id: `ai-news-${Date.now()}-${i}`,
            title: item.title,
            category: item.category,
            published_at: today,
            image_url: base64Image || 'https://images.unsplash.com/photo-1532187875605-1ef638272ee4?auto=format&fit=crop&w=800&q=80',
            summary: item.summary,
            external_url: item.external_url,
            is_ai_generated: true,
            source_name: item.source_name
          });
        } catch (imgError) {
          console.error("AI Scout: Image generation failed for one item, using fallback.", imgError);
          // Simple fallback to a high-quality static themed image if generation fails
          finalizedItems.push({
            id: `ai-news-${Date.now()}-${i}`,
            title: item.title,
            category: item.category,
            published_at: today,
            image_url: 'https://images.unsplash.com/photo-1579152128802-7dc596236282?auto=format&fit=crop&w=800&q=80',
            summary: item.summary,
            external_url: item.external_url,
            is_ai_generated: true,
            source_name: item.source_name
          });
        }
      }

      return finalizedItems;

    } catch (error: any) {
      console.error("Gemini Scouting Engine Error:", error);
      return [];
    }
  },

  aggregateInternalMarketReady: async (): Promise<NewsItem[]> => {
    try {
      const projects = await StorageService.getProjects();
      const marketReady = projects.filter(p => 
        p.status === ProjectStatus.MarketReady || p.status === ProjectStatus.Commercialization
      );
      const today = new Date().toISOString().split('T')[0];

      return marketReady.map(p => ({
        id: `internal-news-${p.id}`,
        title: `UG Milestone: ${p.title} Ready for Adoption`,
        category: 'Market-Ready',
        published_at: p.start_date || today,
        image_url: p.image_url.split('|')[0],
        summary: `University of Ghana announces that the ${p.research_area} innovation from ${p.department} has been commercially validated and is ready for licensing.`,
        external_url: `#/projects/${p.id}`,
        is_ai_generated: false,
        source_name: 'UG Industry Hub'
      }));
    } catch (error) {
      return [];
    }
  }
};
