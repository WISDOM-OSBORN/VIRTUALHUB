import { NewsItem } from "../types";
import { supabase } from "../lib/supabase";

const API_BASE_URL = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');

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
   * force: if true, ignores the cooldown.
   */
  autoSyncNews: async (force: boolean = false): Promise<boolean> => {
    try {
      console.log(`AI Scout client: requesting secure server side news sync (force: ${force})...`);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/ai-scout/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ force })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return !!data.didUpdate;
    } catch (error: any) {
      console.log("AI Scout client news sync status (gracefully handled):", error?.message || error);
      return false;
    }
  }
};
