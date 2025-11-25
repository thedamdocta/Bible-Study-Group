import React from 'react';
import { Clock, Check, Users, Video } from 'lucide-react';

interface FocusModalProps {
  onStart: (minutes: number) => void;
  onStartGroup: () => void;
  onCancel: () => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({ onStart, onStartGroup, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        
        <div className="text-center mb-8">
            <h2 className="font-serif text-3xl text-white mb-2">Choose Your Mode</h2>
            <p className="text-white/50 text-sm">How would you like to engage with Scripture?</p>
        </div>

        {/* Solo Focus Section */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <Clock size={14} /> <span>Solo Focus Session</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[5, 15, 30].map((min) => (
                    <button 
                        key={min}
                        onClick={() => onStart(min)}
                        className="group flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all"
                    >
                        <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{min}</span>
                        <span className="text-[10px] text-white/40 uppercase">Min</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Group Study Section */}
        <div className="mb-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <Users size={14} /> <span>Group Study</span>
            </div>
            <button 
                onClick={onStartGroup}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 group transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Video size={18} />
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-medium group-hover:text-blue-100">Video Call</span>
                        <span className="block text-xs text-white/40">Connect with friends live</span>
                    </div>
                </div>
            </button>
        </div>

        <button 
            onClick={onCancel}
            className="w-full py-3 text-sm text-white/40 hover:text-white transition-colors"
        >
            Cancel
        </button>
      </div>
    </div>
  );
};