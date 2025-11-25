import React, { useEffect, useState, useRef } from 'react';
import { generateStudyNotes, chatWithStudyCoach } from '../services/geminiService';
import { X, Sparkles, Share2, Bookmark, MessageCircle, ArrowRight } from 'lucide-react';
import { Verse, ChatMessage } from '../types';

interface AIContextDrawerProps {
  verse: Verse | null;
  bookName: string;
  chapterNumber: number;
  onClose: () => void;
}

export const AIContextDrawer: React.FC<AIContextDrawerProps> = ({ verse, bookName, chapterNumber, onClose }) => {
  const [activeTab, setActiveTab] = useState<'insight' | 'chat'>('insight');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (verse) {
      setActiveTab('insight');
      setLoading(true);
      generateStudyNotes(verse.text, bookName, chapterNumber)
        .then(text => {
            setContent(text);
            setLoading(false);
        });
      // Reset chat when verse changes
      setMessages([{
          id: '1', 
          role: 'ai', 
          text: `Hi! I'm your study assistant. I can help you understand ${bookName} ${chapterNumber}:${verse.number}. What's on your mind?`
      }]);
    }
  }, [verse, bookName, chapterNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleSendMessage = async () => {
    if (!input.trim() || !verse) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    const context = `${bookName} ${chapterNumber}:${verse.number} - "${verse.text}"`;
    const responseText = await chatWithStudyCoach(input, context);

    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: responseText };
    setMessages(prev => [...prev, aiMsg]);
    setChatLoading(false);
  };

  if (!verse) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-fade-in" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative z-10 pointer-events-auto w-full max-w-2xl bg-[#1a1a1c] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up flex flex-col h-[85vh]">
        
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 bg-[#1a1a1c]">
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#1a1a1c]">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
                        <Sparkles size={12} />
                        <span>Lumina AI Insight</span>
                    </div>
                    <h3 className="text-white font-serif text-xl">{bookName} {chapterNumber}:{verse.number}</h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:bg-white/10"><X size={18} /></button>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-4 text-sm font-medium border-b border-white/5">
                <button 
                    onClick={() => setActiveTab('insight')}
                    className={`pb-2 transition-colors ${activeTab === 'insight' ? 'text-white border-b-2 border-emerald-500' : 'text-white/40 hover:text-white'}`}
                >
                    Insight
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`pb-2 transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-emerald-500' : 'text-white/40 hover:text-white'}`}
                >
                    Study Coach
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#161618]">
            {activeTab === 'insight' ? (
                <div className="p-6">
                    <div className="mb-6 p-4 bg-white/5 border-l-2 border-emerald-500 rounded-r-lg">
                        <p className="font-serif text-lg text-white/90 italic">"{verse.text}"</p>
                    </div>

                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                            <div className="h-4 bg-white/10 rounded w-full"></div>
                            <div className="h-4 bg-white/10 rounded w-5/6"></div>
                            <div className="h-20 bg-white/5 rounded w-full mt-4"></div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
                            <div className="whitespace-pre-line font-sans">
                                {content}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Deeper Study</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            <button onClick={() => setActiveTab('chat')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 whitespace-nowrap flex items-center gap-2">
                                <MessageCircle size={14} /> Ask a Question
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-1 p-6 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-white/10 text-white/90'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 rounded-2xl px-4 py-3 flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce"></div>
                                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-white/10 bg-[#1a1a1c]">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask about history, greek, or theology..."
                                className="w-full bg-black/30 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};