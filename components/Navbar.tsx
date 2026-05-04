
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogIn, LogOut } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { User as UserType } from '../types';

interface NavbarProps {
  isAuthenticated: boolean;
  user: UserType | null;
  onUserIconClick: () => void;
  onLogout: () => void;
  onSelectMessage: (threadId: string) => void;
  unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, user, onUserIconClick, onLogout, onSelectMessage, unreadCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Products', path: '/products' },
    { name: 'News', path: '/news' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-ug-navy text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
             <div className="w-8 h-8 bg-ug-teal rounded-full flex items-center justify-center font-bold text-white">
                UG
             </div>
             <span className="font-bold text-lg tracking-wide">Industry Hub</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-ug-teal text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User & Notifications */}
          <div className="hidden md:flex items-center gap-4">
             {isAuthenticated && (
               <NotificationCenter user={user} onSelectMessage={onSelectMessage} />
             )}
             
             {/* User Icon - Acts as Dashboard Link if logged in, Login trigger if not */}
             <div 
                className={`h-9 w-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${isAuthenticated ? 'bg-ug-teal text-white shadow-lg shadow-ug-teal/50 ring-2 ring-ug-teal/20' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                onClick={onUserIconClick}
                title={isAuthenticated ? "Go to Dashboard" : "Login / Register"}
             >
                {isAuthenticated ? <User size={18} /> : <LogIn size={18} />}
             </div>

             {isAuthenticated && (
                <button 
                  onClick={onLogout}
                  className="text-gray-400 hover:text-white transition"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
             )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-ug-navy border-t border-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-ug-teal text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
               <button 
                  onClick={() => { setIsOpen(false); onUserIconClick(); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${isAuthenticated ? 'bg-ug-teal text-white' : 'text-gray-300 hover:text-white'}`}
               >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span>{isAuthenticated ? 'My Dashboard' : 'Login / Register'}</span>
                  </div>
                  {isAuthenticated && unreadCount > 0 && (
                    <span className="bg-ug-error text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {unreadCount}
                    </span>
                  )}
               </button>
               
               {isAuthenticated && (
                 <button 
                    onClick={() => { setIsOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white"
                 >
                    <LogOut size={18} />
                    <span>Logout</span>
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
