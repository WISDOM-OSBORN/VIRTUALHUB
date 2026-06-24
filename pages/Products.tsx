
import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { Project, ProjectStatus } from '../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const allProjects = await StorageService.getProjects();
      const marketReady = allProjects.filter(p => 
        p.status === ProjectStatus.MarketReady || p.status === ProjectStatus.Commercialization
      );
      setProducts(marketReady);
    };
    fetchProducts();
  }, []);

  const getThumbnail = (urlStr: string) => urlStr && urlStr.trim() !== '' ? urlStr.split('|')[0] : 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="text-ug-teal" size={32} />
            <h1 className="text-4xl font-black text-ug-navy">Innovation Catalog</h1>
          </div>
          <p className="text-gray-600 max-w-2xl text-lg font-medium">
            Discover commercially validated technologies and products developed by University of Ghana researchers, ready for licensing and deployment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group flex flex-col">
              <div className="h-64 relative overflow-hidden">
                <img src={getThumbnail(product.image_url)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                  Market Ready
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <span className="text-ug-teal font-black text-[10px] uppercase tracking-[0.2em] mb-3">{product.research_area}</span>
                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{product.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium flex-1">
                  {product.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-xs font-black uppercase">Licensed Validated</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/projects/${product.id}`)}
                    className="flex items-center gap-2 text-ug-navy font-black text-xs uppercase hover:text-ug-teal transition"
                  >
                    View Specs <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] text-center shadow-inner border border-gray-200">
            <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-ug-navy">No products currently listed.</h3>
            <p className="text-gray-500 mt-2">Check back soon for new commercializations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
