import React from 'react';

interface BaksoRatingProps {
  rating: number; // 1 to 5
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (val: number) => void;
  type?: 'bowl' | 'star' | 'chili';
  label?: string;
}

export const BaksoRating: React.FC<BaksoRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  type = 'bowl',
  label,
}) => {
  const sizeClasses = {
    sm: 'text-base gap-0.5',
    md: 'text-xl gap-1',
    lg: 'text-2xl gap-1.5',
  };

  const getIcon = (filled: boolean) => {
    if (type === 'bowl') {
      return filled ? '🥣' : '🥣'; // bowl icon with dimmed opacity if unfilled
    }
    if (type === 'chili') {
      return filled ? '🌶️' : '🌶️';
    }
    return filled ? '⭐' : '★';
  };

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-xs font-pixel text-amber-300 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {Array.from({ length: maxRating }).map((_, idx) => {
          const itemValue = idx + 1;
          const isFilled = itemValue <= rating;

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(itemValue)}
              className={`transition-all transform ${
                interactive
                  ? 'cursor-pointer hover:scale-125 active:scale-95'
                  : 'cursor-default'
              } ${isFilled ? 'opacity-100 scale-100' : 'opacity-25 grayscale'}`}
              title={interactive ? `Rating ${itemValue} / ${maxRating}` : undefined}
            >
              <span className="drop-shadow-sm select-none">
                {getIcon(isFilled)}
              </span>
            </button>
          );
        })}
        <span className="ml-1.5 text-xs font-pixel text-amber-200/80">
          ({rating}/{maxRating})
        </span>
      </div>
    </div>
  );
};
