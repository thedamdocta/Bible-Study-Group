
import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Sliders, Sparkles, Zap } from 'lucide-react';
import { Chapter, Book } from '../types';
import { audioService } from '../services/audioService';

interface AudioPlayerProps {
    book: Book;
    chapter: Chapter | null;
    onBack: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ book, chapter, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const initializedRef = useRef(false);
  
  // Effect to handle narration lifecycle
  useEffect(() => {
    if (chapter?.content && !initializedRef.current) {
      initializedRef.current = true;
      // Start Resemble AI Narration
      audioService.speak(chapter.content, () => {
        setIsPlaying(false);
        initializedRef.current = false;
      });
      setIsPlaying(true);
    }
    
    // Cleanup on unmount or chapter change
    return () => {
      audioService.stop();
      initializedRef.current = false;
    };
  }, [chapter]);

  const togglePlay = () => {
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    } else {
      // If we stopped, we might need to re-initialize or resume
      if (!initializedRef.current && chapter?.content) {
          audioService.speak(chapter.content, () => setIsPlaying(false));
          initializedRef.current = true;
      } else {
          audioService.resume();
      }
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    audioService.stop();
    onBack();
  };

  return (
    <div className="relative z-20 min-h-screen flex flex-col bg-[#050505] animate-fade-in overflow-hidden">
        {/* Subtle background glow based on book theme */}
        <div className={`absolute inset-0 bg-gradient-to-b ${book.themeColor} opacity-20 blur-[100px] pointer-events-none`} />

        <div className="relative z-10 flex items-center justify-between px-6 py-6">
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">Now Narrating</span>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Zap size={10} className="text-emerald-400 fill-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Resemble AI Engine</span>
                    </div>
                </div>
            </div>
            <button className="p-2 rounded-full hover:bg-white/10 text-white/70">
                <Sliders size={20} />
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
            <div className={`relative group w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-gradient-to-br ${book.themeColor} shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 flex items-center justify-center mb-12 overflow-hidden`}>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-700" />
                <span className="relative z-10 font-serif text-9xl text-white/10 italic select-none pointer-events-none">{book.name.charAt(0)}</span>
                
                {/* Dynamic Visualizer Overlay */}
                {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-12">
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-white/60 rounded-full transition-all duration-300"
                                style={{ 
                                    height: `${20 + Math.random() * 60}%`, 
                                    opacity: 0.3 + (Math.random() * 0.7),
                                    animation: `pulse 1.5s infinite ease-in-out ${i * 0.1}s` 
                                }} 
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-3 tracking-tight">{book.name}</h2>
                <div className="flex items-center justify-center gap-3">
                   <div className="h-px w-8 bg-white/20" />
                   <p className="text-emerald-500 text-sm font-sans font-bold tracking-[0.4em] uppercase">Chapter {chapter?.chapterNumber}</p>
                   <div className="h-px w-8 bg-white/20" />
                </div>
            </div>

            <div className="w-full max-w-sm mt-12 mb-4">
                <div className="h-1 bg-white/5 rounded-full w-full relative overflow-hidden group">
                    <div 
                        className={`absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-white rounded-full transition-all duration-300 ${isPlaying ? 'w-full animate-[shimmer_10s_infinite_linear]' : 'w-1/3'}`}
                    />
                </div>
                <div className="flex justify-between mt-4 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    <span>0:00</span>
                    <span className="text-emerald-500/50">Lossless Audio</span>
                    <span>HD</span>
                </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-xs mt-12">
                <button className="text-white/20 hover:text-white transition-all hover:scale-110">
                    <SkipBack size={24} />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] group"
                >
                    {isPlaying ? (
                        <Pause size={40} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    ) : (
                        <Play size={40} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform" />
                    )}
                </button>
                
                <button className="text-white/20 hover:text-white transition-all hover:scale-110">
                    <SkipForward size={24} />
                </button>
            </div>
            
            <div className="mt-16 flex items-center gap-6 text-white/20">
                <Volume2 size={16} />
                <div className="w-32 h-1 bg-white/5 rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-white/20 rounded-full" />
                </div>
            </div>
        </div>
        
        <div className="h-24" />

        <style>{`
            @keyframes pulse {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(1.5); }
            }
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
  );
};
