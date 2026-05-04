import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-white text-lg font-bold mb-4">UG Industry Hub</h3>
            <p className="text-sm leading-relaxed">
              Bridging the gap between academic research and industrial application. Fostering innovation for a better future.
            </p>
          </div>
          
          <div>
            <h3 className="text-white text-md font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-ug-teal transition">Research Projects</a></li>
              <li><a href="#" className="hover:text-ug-teal transition">Find Experts</a></li>
              <li><a href="#" className="hover:text-ug-teal transition">Technology Transfer</a></li>
              <li><a href="#" className="hover:text-ug-teal transition">Events & News</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-md font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Legon Campus, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>industry@ug.edu.gh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>+233 302 123 456</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-md font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-ug-teal transition"><Facebook size={20} /></a>
              <a href="#" className="hover:text-ug-teal transition"><Twitter size={20} /></a>
              <a href="#" className="hover:text-ug-teal transition"><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} University of Ghana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;