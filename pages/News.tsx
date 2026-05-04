
import React, { useState, useEffect } from 'react';
import { Calendar, Tag, ChevronRight, Newspaper, Sparkles, Loader2, ExternalLink, Globe, Zap, RefreshCw, Microscope, Clock } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AIScoutService } from '../services/aiScoutService';
import { NewsItem } from '../types';

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchNews = async () => {
    const data = await StorageService.getNews();
    setNews(data);
    const syncTime = await AIScoutService.getLastSyncTime();
    setLastSync(syncTime);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchNews();

    // Silent background sync check
    AIScoutService.autoSyncNews().then(didUpdate => {
      if (didUpdate) fetchNews();
    });
  }, []);

  const handleManualScout = async () => {
    setIsScouting(true);
    try {
      const didUpdate = await AIScoutService.autoSyncNews(true); // force = true
      if (didUpdate) await fetchNews();
    } finally {
      setIsScouting(false);
    }
  };

  const handleNewsClick = (item: NewsItem) => {
    if (item.external_url) {
      if (item.external_url.startsWith('#')) {
        window.location.hash = item.external_url;
      } else {
        window.open(item.external_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Fallback for broken images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1532187875605-1ef638272ee4?auto=format&fit=crop&w=800&q=80';
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-20 border-b border-gray-100 pb-12 gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-ug-navy rounded-[2rem] text-white shadow-2xl">
                 <Microscope size={32} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-ug-navy tracking-tighter">Discovery Feed</h1>
                <p className="text-ug-teal font-black text-[10px] uppercase tracking-[0.5em] mt-1">University of Ghana Innovation Watch</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium text-lg max-w-2xl leading-relaxed">
              Monitoring global and local breakthroughs in vaccines, drug discoveries, and diagnostics.
            </p>
            {lastSync && (
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Clock size={14} className="text-ug-teal" />
                Last Automated Sync: {lastSync.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            )}
          </div>

          <button 
            onClick={handleManualScout}
            disabled={isScouting}
            className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl
              ${isScouting ? 'bg-ug-navy text-white cursor-wait' : 'bg-ug-navy text-white hover:bg-ug-teal hover:scale-[1.02] active:scale-[0.98]'}`}
          >
            {isScouting ? (
              <>
                <Loader2 className="animate-spin text-ug-teal" size={20} />
                <span>Running Deep Scout...</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} className="text-ug-teal" />
                <span>Manual Override</span>
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && !isScouting && (
           <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-ug-teal mb-6" size={56} />
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em]">Aggregating Intelligence...</p>
           </div>
        )}

        {/* News Grid */}
        <div className="grid lg:grid-cols-1 gap-12">
          {news.length === 0 && !loading && (
            <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem]">
               <Globe className="text-gray-200 mx-auto mb-8" size={80} />
               <h3 className="text-2xl font-black text-ug-navy">The Feed is Prime</h3>
               <p className="text-gray-400 font-medium mt-3 text-lg">Autonomous scouting is active. New breakthroughs will appear every 24 hours.</p>
            </div>
          )}

          {news.map((item, idx) => (
            <article 
              key={item.id} 
              onClick={() => handleNewsClick(item)}
              className="group bg-gray-50/30 rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row border border-gray-100 hover:bg-white hover:shadow-2xl hover:border-ug-teal/10 transition-all duration-700 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="md:w-[400px] h-80 md:h-auto overflow-hidden relative shrink-0">
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 grayscale-[20%] group-hover:grayscale-0" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ug-navy/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-end p-10">
                   <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ug-teal mb-2">Original Context Available</p>
                      <div className="flex items-center gap-2">
                         <span className="font-bold text-lg">Access Full Briefing</span>
                         <ExternalLink size={20} />
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="p-12 md:p-16 flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-6 mb-8">
                  <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full shadow-sm ${item.is_ai_generated ? 'bg-ug-teal text-white' : 'bg-ug-navy text-white'}`}>
                    {item.is_ai_generated ? <Zap size={14} className="fill-white" /> : <Tag size={14} />} 
                    {item.category}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Calendar size={18} /> {item.published_at}
                  </span>
                  {item.source_name && (
                    <span className="flex items-center gap-2 text-[10px] font-black text-ug-navy uppercase tracking-[0.2em] bg-white px-6 py-2.5 rounded-full border border-gray-100 shadow-sm">
                       <Globe size={18} className="text-ug-teal" /> {item.source_name}
                    </span>
                  )}
                </div>
                
                <h2 className="text-4xl font-black text-ug-navy mb-8 leading-[1.1] group-hover:text-ug-teal transition-colors tracking-tight max-w-3xl">
                  {item.title}
                </h2>
                
                <p className="text-gray-500 font-medium text-xl leading-relaxed mb-10 line-clamp-3 max-w-4xl whitespace-pre-line">
                  {item.summary}
                </p>
                
                <div className="flex items-center gap-4 text-ug-navy font-black text-sm uppercase tracking-widest group-hover:text-ug-teal transition-all group-hover:translate-x-4">
                  Explore Full Discovery <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer Status */}
        <div className="mt-32 text-center">
           <div className="inline-flex items-center gap-4 px-10 py-4 bg-gray-50 rounded-full border border-gray-100">
              <Sparkles size={18} className="text-ug-teal" /> 
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em]">
                 Autonomous Research Scout Operational
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default News;
