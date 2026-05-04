
import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { Project, ProjectStatus, ResearchArea } from '../types';

const Projects: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await StorageService.getProjects();
      setProjects(data);

      // Check for track parameter in URL
      const trackParam = searchParams.get('track');
      if (trackParam && Object.values(ResearchArea).includes(trackParam as ResearchArea)) {
        setSelectedArea(trackParam);
      }
    };
    fetchProjects();
  }, [searchParams]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'All' || project.research_area === selectedArea;
    const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus;
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Concept: return 'bg-gray-100 text-gray-800 border-gray-200';
      case ProjectStatus.ProofOfConcept: return 'bg-blue-50 text-blue-700 border-blue-100';
      case ProjectStatus.Prototype: return 'bg-purple-50 text-purple-700 border-purple-100';
      case ProjectStatus.Validation: return 'bg-orange-50 text-orange-700 border-orange-100';
      case ProjectStatus.Commercialization: return 'bg-ug-teal/10 text-ug-teal border-ug-teal/20';
      case ProjectStatus.MarketReady: return 'bg-green-50 text-green-700 border-green-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThumbnail = (urlStr: string) => urlStr ? urlStr.split('|')[0] : '';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-ug-navy tracking-tight">Research Pipeline</h1>
          <p className="mt-2 text-gray-600 font-medium text-lg">Browse groundbreaking research from University of Ghana scholars.</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ug-teal focus:border-transparent transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                 <select 
                    className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-6 pr-12 rounded-2xl font-black text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-ug-teal transition-all cursor-pointer"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                 >
                    <option value="All">All Research Tracks</option>
                    {Object.values(ResearchArea).map(area => (
                       <option key={area} value={area}>{area}</option>
                    ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <Filter size={18} />
                 </div>
              </div>

              <div className="relative flex-1 md:flex-none">
                 <select 
                    className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-6 pr-12 rounded-2xl font-black text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-ug-teal transition-all cursor-pointer"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                 >
                    <option value="All">All Statuses</option>
                    {Object.values(ProjectStatus).map(status => (
                       <option key={status} value={status}>{status}</option>
                    ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <SlidersHorizontal size={18} />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-gray-100 group animate-fade-in-up">
              <div className="h-64 relative overflow-hidden">
                 <img 
                    src={getThumbnail(project.image_url)} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                 <div className="absolute bottom-4 left-6 text-white">
                    <div className="text-[10px] font-black bg-ug-teal px-3 py-1 rounded-full inline-block mb-2 shadow-xl backdrop-blur-md tracking-widest uppercase">Stage {project.trl}</div>
                    <div className="text-xs opacity-90 font-bold uppercase tracking-widest">{project.department}</div>
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-gray-900 mb-3 leading-tight group-hover:text-ug-teal transition-colors">{project.title}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed font-medium">{project.description}</p>
                
                <div className="mt-4 space-y-4 pt-6 border-t border-gray-100">
                   <div className="flex justify-between text-xs items-center">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Development Stage</span>
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(project.status)} shadow-sm`}>
                        {project.status}
                      </span>
                   </div>
                   <div className="flex justify-between text-xs items-center">
                      <span className="text-gray-400 font-bold uppercase tracking-widest">Budget</span>
                      <span className="font-black text-ug-navy">{project.budget}</span>
                   </div>
                </div>

                <button 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="mt-8 w-full py-4 bg-ug-navy text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-ug-teal hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-ug-navy/10 flex items-center justify-center gap-2"
                >
                   View Case Study <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
           <div className="text-center py-32 animate-fade-in">
              <div className="inline-block p-8 rounded-[2rem] bg-gray-100 mb-6 shadow-inner">
                 <Search size={48} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-black text-ug-navy">No results found</h3>
              <p className="text-gray-500 mt-2 font-medium">Try refining your research keywords.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
