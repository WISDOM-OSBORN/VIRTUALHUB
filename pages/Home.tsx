
import React, { useState, useEffect } from 'react';
import { ArrowRight, Microscope, Pill, Syringe, CheckCircle, Send, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HERO_IMAGES } from '../constants';
import { ProjectStatus, Project, ResearchArea } from '../types';
import { StorageService } from '../services/storageService';

const Home: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [marketReadyProducts, setMarketReadyProducts] = useState<Project[]>([]);
  const [showcaseProjects, setShowcaseProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const heroCaptions = [
    { title: "Vaccine Innovation", text: "Pioneering next-generation vaccines for a healthier Africa." },
    { title: "Diagnostic Excellence", text: "Precision tools for rapid and accurate disease detection." },
    { title: "Pharmaceutical Research", text: "Harnessing local biodiversity for global medicine." }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allProjects = await StorageService.getProjects();
        setMarketReadyProducts(allProjects.filter(p => p.status === ProjectStatus.MarketReady || p.status === ProjectStatus.Commercialization));
        setShowcaseProjects(allProjects.filter(p => p.status !== ProjectStatus.MarketReady && p.status !== ProjectStatus.Commercialization).slice(0, 3));
      } catch (err) {
        console.error("Home Data Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 6000); 

    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (area: ResearchArea) => {
    navigate(`/projects?track=${encodeURIComponent(area)}`);
  };

  const getThumbnail = (urlStr: string) => urlStr ? urlStr.split('|')[0] : '';

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HERO SECTION */}
      <div className="relative bg-ug-navy overflow-hidden h-[750px] flex items-center">
        {HERO_IMAGES.map((img, index) => (
           <div 
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1500 ease-in-out ${index === currentImageIndex ? 'opacity-50 scale-100' : 'opacity-0 scale-105'}`}
              style={{ backgroundImage: `url('${img}')` }}
           ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ug-navy via-ug-navy/70 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col h-full justify-center">
          <div className="md:w-2/3 mt-20">
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
               <span className="h-0.5 w-12 bg-ug-teal"></span>
               <span className="text-xs font-black text-ug-teal uppercase tracking-[0.4em]">LIVE TRACK: Innovation Hub</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight mb-4">
              {heroCaptions[currentImageIndex].title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-md">
              {heroCaptions[currentImageIndex].text}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/projects" className="bg-ug-teal text-white px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white hover:text-ug-teal transition-all shadow-2xl flex items-center gap-3">
                Explore The Pipeline <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CORE RESEARCH AREAS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-ug-navy tracking-tight">Accelerating Regional Health</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto font-medium text-lg">
              Connecting African ingenuity with global markets through cloud-first collaboration.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div 
              onClick={() => handleCategoryClick(ResearchArea.Diagnostics)}
              className="p-10 rounded-3xl bg-gray-50 hover:bg-ug-navy hover:text-white transition-all border border-gray-100 group shadow-sm cursor-pointer"
            >
              <Microscope size={40} className="text-ug-teal mb-6 group-hover:text-white" />
              <h3 className="text-2xl font-black mb-4">Diagnostics</h3>
              <p className="text-gray-500 group-hover:text-gray-300 font-medium">TRL 7+ systems for high-throughput screening.</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ug-teal group-hover:text-white transition-colors">
                View Pipeline <ArrowRight size={14} />
              </div>
            </div>
            <div 
              onClick={() => handleCategoryClick(ResearchArea.Pharmaceutical)}
              className="p-10 rounded-3xl bg-gray-50 hover:bg-ug-teal hover:text-white transition-all border border-gray-100 group shadow-sm cursor-pointer"
            >
              <Pill size={40} className="text-ug-teal mb-6 group-hover:text-white" />
              <h3 className="text-2xl font-black mb-4">Pharmaceutical</h3>
              <p className="text-gray-500 group-hover:text-white font-medium">Standardizing indigenous medicines for clinical validation.</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white transition-colors">
                View Pipeline <ArrowRight size={14} />
              </div>
            </div>
            <div 
              onClick={() => handleCategoryClick(ResearchArea.Vaccines)}
              className="p-10 rounded-3xl bg-gray-50 hover:bg-indigo-900 hover:text-white transition-all border border-gray-100 group shadow-sm cursor-pointer"
            >
              <Syringe size={40} className="text-indigo-500 mb-6 group-hover:text-white" />
              <h3 className="text-2xl font-black mb-4">Vaccines</h3>
              <p className="text-gray-500 group-hover:text-gray-300 font-medium">Thermostable antigen delivery platforms.</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">
                View Pipeline <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PRODUCTS */}
      <section className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black text-ug-navy tracking-tight">Market-Ready Innovations</h2>
              {isLoading && <Loader2 className="animate-spin text-ug-teal" />}
           </div>
           <div className="grid md:grid-cols-2 gap-8">
             {marketReadyProducts.map(product => (
               <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition group">
                 <div className="md:w-2/5 h-64 md:h-auto overflow-hidden">
                    <img src={getThumbnail(product.image_url)} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                 </div>
                 <div className="p-8 md:w-3/5 flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-gray-900 mb-3">{product.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 font-medium line-clamp-2">{product.description}</p>
                    <button onClick={() => navigate(`/projects/${product.id}`)} className="text-xs font-black text-ug-navy border-b-2 border-ug-navy pb-1 hover:text-ug-teal transition uppercase tracking-widest">Detail Brief</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
