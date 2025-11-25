import React from 'react';

interface BackgroundGradientProps {
  colorTheme: string;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({ colorTheme }) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorTheme} opacity-40 transition-colors duration-1000 ease-in-out`} />
      
      {/* Mesh Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] mix-blend-overlay animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] mix-blend-overlay" />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
    </div>
  );
};
