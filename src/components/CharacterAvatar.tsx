import React from 'react';
import { ExpressionId } from '../types';
import { EXPRESSIONS } from '../data/expressions';

interface CharacterAvatarProps {
  expression: ExpressionId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFrame?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  expression,
  size = 'md',
  showFrame = true,
  className = '',
  onClick,
}) => {
  const safeExprId = expression && EXPRESSIONS[expression] ? expression : 'happy';
  const exprData = EXPRESSIONS[safeExprId] || {
    id: 'happy',
    name: 'Senang',
    description: 'Pemberani & gembira',
    emoji: '😊',
    bgHex: '#10B981',
    borderColor: '#059669',
  };

  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-3xl',
  };

  const frameSizeMap = {
    sm: 'p-0.5 border-2',
    md: 'p-1 border-3',
    lg: 'p-1.5 border-4',
    xl: 'p-2 border-4',
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: exprData.bgHex,
        borderColor: exprData.borderColor,
      }}
      className={`relative flex items-center justify-center rounded-xl shadow-md transition-all transform hover:scale-105 select-none ${
        sizeMap[size]
      } ${showFrame ? `${frameSizeMap[size]} border-amber-950/80` : ''} ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${className}`}
      title={`${exprData.name}: ${exprData.description}`}
    >
      {/* Head Expression Vector / SVG Pixel Graphic */}
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Pixel SVG Head Canvas */}
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Head Oval */}
          <rect x="6" y="6" width="20" height="20" rx="6" fill="#FCD34D" stroke="#78350F" strokeWidth="1.5" />
          
          {/* Hair / Bandana / Chef Cap */}
          <rect x="6" y="4" width="20" height="6" rx="2" fill="#991B1B" />
          <rect x="13" y="2" width="6" height="3" fill="#FEF3C7" />

          {/* Expressions specific details */}
          {expression === 'happy' && (
            <>
              {/* Happy Curve Eyes */}
              <path d="M10 14 Q12 12 14 14" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 14 Q20 12 22 14" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
              {/* Big Satisfied Smile */}
              <path d="M11 19 Q16 25 21 19 Z" fill="#DC2626" stroke="#451A03" strokeWidth="1" />
              {/* Cheeks */}
              <circle cx="9" cy="18" r="1.5" fill="#F87171" />
              <circle cx="23" cy="18" r="1.5" fill="#F87171" />
            </>
          )}

          {expression === 'spicy' && (
            <>
              {/* Fire Eyes or Flame Sweat */}
              <rect x="9" y="12" width="4" height="4" fill="#DC2626" />
              <rect x="19" y="12" width="4" height="4" fill="#DC2626" />
              <circle cx="11" cy="14" r="1" fill="#FEF3C7" />
              <circle cx="21" cy="14" r="1" fill="#FEF3C7" />
              {/* Open Mouth with Flame */}
              <rect x="12" y="19" width="8" height="5" rx="2" fill="#7F1D1D" />
              <path d="M14 20 L16 17 L18 20" stroke="#F59E0B" strokeWidth="1.5" />
              {/* Sweat Drops */}
              <path d="M26 8 Q27 12 25 13 Q24 12 26 8 Z" fill="#60A5FA" />
            </>
          )}

          {expression === 'star' && (
            <>
              {/* Star Glasses or Shining Eyes */}
              <path d="M11 12 L12 14 L14 14 L12.5 15.5 L13 17.5 L11 16 L9 17.5 L9.5 15.5 L8 14 L10 14 Z" fill="#F59E0B" />
              <path d="M21 12 L22 14 L24 14 L22.5 15.5 L23 17.5 L21 16 L19 17.5 L19.5 15.5 L18 14 L20 14 Z" fill="#F59E0B" />
              {/* Grin */}
              <path d="M12 20 Q16 24 20 20" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {expression === 'cool' && (
            <>
              {/* Sunglasses */}
              <rect x="8" y="12" width="7" height="5" rx="1" fill="#18181B" />
              <rect x="17" y="12" width="7" height="5" rx="1" fill="#18181B" />
              <line x1="15" y1="14" x2="17" y2="14" stroke="#18181B" strokeWidth="2" />
              {/* Cool Smirk */}
              <path d="M13 21 Q17 22 20 19" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {expression === 'shocked' && (
            <>
              {/* Wide Eyes */}
              <circle cx="11" cy="13" r="3" fill="#FFFFFF" stroke="#451A03" strokeWidth="1" />
              <circle cx="21" cy="13" r="3" fill="#FFFFFF" stroke="#451A03" strokeWidth="1" />
              <circle cx="11" cy="13" r="1" fill="#000000" />
              <circle cx="21" cy="13" r="1" fill="#000000" />
              {/* O Mouth */}
              <circle cx="16" cy="20" r="3" fill="#78350F" />
            </>
          )}

          {expression === 'greedy' && (
            <>
              {/* Drooling Eyes & Tongue */}
              <path d="M9 13 Q11 11 13 13" stroke="#451A03" strokeWidth="2" />
              <path d="M19 13 Q21 11 23 13" stroke="#451A03" strokeWidth="2" />
              <path d="M11 18 Q16 24 21 18 Z" fill="#DC2626" stroke="#451A03" strokeWidth="1" />
              <path d="M14 20 Q16 23 18 20" fill="#F87171" />
              {/* Small Meatball Bowl Icon */}
              <circle cx="25" cy="24" r="3.5" fill="#9A3412" stroke="#FEF3C7" strokeWidth="0.8" />
            </>
          )}
        </svg>
      </div>

      {/* Floating Emoji Badge */}
      <span className="absolute -bottom-1 -right-1 leading-none drop-shadow-md select-none">
        {exprData.emoji}
      </span>
    </div>
  );
};
