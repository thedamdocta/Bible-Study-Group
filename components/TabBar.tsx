import React from 'react';
import { Tab } from '../types';
import { Plus, X, BookOpen, Map, Sparkles, MessageSquare } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick, onNewTab, onCloseTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-xs font-bold text-white/30 tracking-widest uppercase">Workspace</span>
        <button onClick={onNewTab} className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors">
          New <Plus size={14} />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`
                relative flex-shrink-0 w-40 p-3 rounded-2xl cursor-pointer transition-all duration-300 snap-start
                border ${isActive ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                  {tab.type === 'reader' && <BookOpen size={14} />}
                  {tab.type === 'map' && <Map size={14} />}
                  {tab.type === 'study' && <MessageSquare size={14} />}
                  {tab.type === 'context' && <Sparkles size={14} />}
                </div>
                {tabs.length > 1 && (
                  <button 
                    onClick={(e) => onCloseTab(tab.id, e)}
                    className="text-white/20 hover:text-white p-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <h4 className={`text-xs font-medium leading-tight line-clamp-2 ${isActive ? 'text-white' : 'text-white/50'}`}>
                {tab.title}
              </h4>
            </div>
          );
        })}
      </div>
    </div>
  );
};
