
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { getGeminiResponse } from '../services/geminiService';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    
    // Optimistic update
    const newHistory = [
      ...history,
      { role: 'user' as const, parts: [{ text: userMessage }] }
    ];
    setHistory(newHistory);
    setIsLoading(true);

    const response = await getGeminiResponse(userMessage, history);

    setHistory([
      ...newHistory,
      { role: 'model' as const, parts: [{ text: response }] }
    ]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-fade-in-up">
          {/* Header */}
          <div className="bg-ug-navy p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-ug-teal" />
              <h3 className="font-semibold text-sm">UG Research Assistant</h3>
            </div>
            <button onClick={toggleChat} className="hover:bg-white/10 p-1 rounded transition">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
             {history.length === 0 && (
                <div className="text-center text-gray-400 mt-10 text-sm">
                   <p>Hello! I can help you find research projects, potential partners, or explain TRLs.</p>
                </div>
             )}
            {history.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-ug-teal text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about research..."
                className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className={`p-1.5 rounded-full ${
                  isLoading || !message.trim() ? 'text-gray-400' : 'bg-ug-navy text-white hover:bg-opacity-90'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-center mt-1">
               {/* Updated label to reflect the use of gemini-3.1-pro-preview */}
               <span className="text-[10px] text-gray-400">Powered by Gemini 3.1 Pro</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`${
          isOpen ? 'scale-0' : 'scale-100'
        } transition-transform duration-200 bg-ug-navy border-2 border-ug-teal text-white p-4 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center`}
      >
        <MessageSquare size={24} />
      </button>
    </div>
  );
};

export default AIAssistant;
