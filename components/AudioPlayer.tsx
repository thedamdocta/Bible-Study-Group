
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Sliders } from 'lucide-react';
import { Chapter, Book } from '../types';
import { audioService } from '../services/audioService';

interface AudioPlayerProps {
    book: Book;
    chapter: Chapter | null;
    onBack: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ book, chapter, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (chapter?.content) {
      // Start playing automatically when opened
      audioService.speak(chapter.content, () => setIsPlaying(false));
      setIsPlaying(true);
    }

    // Cleanup on unmount
    return () => {
      audioService.stop();
    };
  }, [chapter]);

  const togglePlay = () => {
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    } else {
      // If we are paused, resume. If stopped, restart.
      if (window.speechSynthesis.paused) {
        audioService.resume();
      } else if (!window.speechSynthesis.speaking && chapter?.content) {
         audioService.speak(chapter.content, () => setIsPlaying(false));
      }
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    audioService.stop();
    onBack();
  };

  return (
    <div className="relative z-20 min-h-screen flex flex-col bg-black/90 backdrop-blur-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-6">
            <button onClick={handleBack} className="p-2 rounded-full hover:bg-white/10 text-white/70">
                <ArrowLeft size={24} />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase text-white/40">Now Playing</span>
            <button className="p-2 rounded-full hover:bg-white/10 text-white/70">
                <Sliders size={20} />
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className={`w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br ${book.themeColor} shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-center mb-12`}>
                <span className="font-serif text-8xl text-white/20 italic">{book.name.charAt(0)}</span>
            </div>

            <h2 className="text-3xl font-serif text-center text-white mb-2">{book.name} Chapter {chapter?.chapterNumber}</h2>
            <p className="text-white/50 text-sm tracking-wide uppercase">WEB Translation</p>

            <div className="w-full mt-12 mb-4">
                {/* Simulated Waveform / Progress */}
                <div className="h-1 bg-white/10 rounded-full w-full relative overflow-hidden">
                    <div className={`absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-300 ${isPlaying ? 'w-full animate-[pulse_3s_infinite]' : 'w-0'}`}></div>
                </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-xs mt-8">
                <button className="text-white/40 hover:text-white transition-colors" disabled>
                    <SkipBack size={28} />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    {isPlaying ? (
                        <Pause size={32} fill="currentColor" />
                    ) : (
                        <Play size={32} fill="currentColor" className="ml-1" />
                    )}
                </button>
                
                <button className="text-white/40 hover:text-white transition-colors" disabled>
                    <SkipForward size={28} />
                </button>
            </div>
            
            <p className="mt-8 text-xs text-white/20 font-mono uppercase">Web Speech API • System Voice</p>
        </div>
        
        <div className="h-20"></div>
    </div>
  );
};
