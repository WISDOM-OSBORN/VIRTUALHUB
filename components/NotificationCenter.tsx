
import React, { useState, useEffect, useRef } from 'react';
import { Bell, MailOpen, User as UserIcon } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { User } from '../types';

interface NotificationCenterProps {
  user: User | null;
  onSelectMessage: (threadId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, onSelectMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<any[][]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      StorageService.getConversations(user.id).then(setThreads);
    }
  }, [user?.id, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadThreads = threads.filter(t => t.some(m => !m.read && m.recipient_id === user?.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white"
      >
        <Bell size={20} className={unreadThreads.length > 0 ? "text-ug-teal animate-pulse" : ""} />
        {unreadThreads.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-ug-navy rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-[120] overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h4 className="font-black text-ug-navy text-sm uppercase tracking-widest">Notifications</h4>
            <span className="text-[10px] font-black text-ug-teal bg-ug-teal/10 px-2 py-1 rounded-lg uppercase tracking-widest">
              {unreadThreads.length} New
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {unreadThreads.length === 0 ? (
              <div className="p-10 text-center">
                <MailOpen size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">All caught up</p>
              </div>
            ) : (
              unreadThreads.map((thread, i) => {
                const lastMsg = thread[0];
                return (
                  <div 
                    key={i}
                    onClick={() => {
                      onSelectMessage(lastMsg.project_id || 'general');
                      setIsOpen(false);
                    }}
                    className="p-5 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-ug-navy/5 flex items-center justify-center text-ug-navy shrink-0">
                        <UserIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-ug-navy text-xs truncate text-left">{lastMsg.user_name}</p>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <p className="text-[10px] font-bold text-ug-teal uppercase tracking-widest mb-1 truncate text-left">{lastMsg.projects?.title || 'General Inquiry'}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed text-left">{lastMsg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
             <button 
              onClick={() => { onSelectMessage('all'); setIsOpen(false); }}
              className="text-[10px] font-black text-ug-navy uppercase tracking-[0.2em] hover:text-ug-teal transition"
             >
               View All Messages
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
