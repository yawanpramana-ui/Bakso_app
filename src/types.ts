export type PriceRange = '$' | '$$' | '$$$';

export type ExpressionId = 
  | 'happy' 
  | 'spicy' 
  | 'star' 
  | 'shocked' 
  | 'cool' 
  | 'greedy';

export interface CharacterExpression {
  id: ExpressionId;
  name: string;
  emoji: string;
  bgHex: string;
  borderColor: string;
  description: string;
  avatarUrl?: string;
}

export interface BaksoSpot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number; // 1 to 5 bowls
  characterExpression: ExpressionId;
  flavorRating: number; // Broth / Kuah rating 1-5
  meatballRating: number; // Texture / Pentol rating 1-5
  sambalLevel: number; // 0 to 5 chili icons
  priceRange: PriceRange;
  atmosphere: string;
  review: string;
  photoUrl?: string;
  visitDate: string;
  tags: string[];
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
}

export interface HunterProfile {
  name: string;
  title: string;
  avatarExpression: ExpressionId;
  level: number;
  xp: number;
  nextLevelXp: number;
  favoriteType: string;
}
