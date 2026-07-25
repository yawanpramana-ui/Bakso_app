import React, { useEffect, useState } from 'react';
import { soundFx } from '../utils/audio';
import { Sparkles, Flame, Shield, Award } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Memuat Dunia RPG...');

  useEffect(() => {
    soundFx.playSuccess();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFinish();
          }, 300);
          return 100;
        }

        const next = prev + 5;
        if (next === 25) setLoadingText('Mencari Kedai Bakso Terdekat...');
        if (next === 50) setLoadingText('Merapikan Bumbu Sambal & Kaldu...');
        if (next === 75) setLoadingText('Menghubungkan Database Cloud...');
        if (next === 95) setLoadingText('Siap Berpetualang!');

        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0a12] flex flex-col items-center justify-center p-4 font-pixel text-amber-100 select-none animate-fade-in overflow-hidden">
      {/* Retro Animated Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#800000_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center space-y-6">
        {/* Animated Pixel Icon */}
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#800000] border-4 border-[#ffd700] flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(255,215,0,0.5)] animate-bounce">
            🍜
          </div>
          <div className="absolute -top-2 -right-2 bg-red-600 text-[#ffd700] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#ffd700] shadow animate-pulse">
            RPG V2.0
          </div>
        </div>

        {/* Game Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-[#ffd700] drop-shadow-[0_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2">
            <span>BAKSO QUEST</span>
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          </h1>
          <p className="text-xs sm:text-sm text-amber-300 tracking-widest font-bold">
            LEGENDA SAMBAL NUSANTARA
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full space-y-2 bg-[#1b1524] p-4 rounded-2xl border-2 border-amber-800 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold px-1">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span>{loadingText}</span>
            </span>
            <span>{progress}%</span>
          </div>

          <div className="w-full h-4 bg-black/80 rounded-full border border-amber-600/80 p-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-amber-500 to-[#ffd700] rounded-full transition-all duration-150 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-pulse" />
            </div>
          </div>
        </div>

        <p className="text-[10px] text-amber-500/80 tracking-widest uppercase">
          © 2026 BAKSO QUEST STUDIO • Cloud Database Connected
        </p>
      </div>
    </div>
  );
};
