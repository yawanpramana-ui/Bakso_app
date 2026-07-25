import { CharacterExpression, ExpressionId } from '../types';

export const EXPRESSIONS: Record<ExpressionId, CharacterExpression> = {
  happy: {
    id: 'happy',
    name: 'Puas & Kenyang',
    emoji: '😋',
    bgHex: '#10B981', // Emerald green
    borderColor: '#059669',
    description: 'Kuah gurih, pentol kenyal, perut gembira!',
  },
  spicy: {
    id: 'spicy',
    name: 'Pedas Meledak!',
    emoji: '🥵',
    bgHex: '#EF4444', // Red
    borderColor: '#DC2626',
    description: 'Sambal setan bikin mandi keringat!',
  },
  star: {
    id: 'star',
    name: 'Bintang Super / Legend',
    emoji: '🤩',
    bgHex: '#F59E0B', // Amber Gold
    borderColor: '#D97706',
    description: 'Rasa bintang 5, wajib balik lagi!',
  },
  cool: {
    id: 'cool',
    name: 'Santai & Syahdu',
    emoji: '😎',
    bgHex: '#3B82F6', // Blue
    borderColor: '#2563EB',
    description: 'Tempat nyaman, bakso mantap, santai max.',
  },
  shocked: {
    id: 'shocked',
    name: 'Unik & Beda',
    emoji: '😲',
    bgHex: '#8B5CF6', // Purple
    borderColor: '#7C3AED',
    description: 'Porsi raksasa / variasi bakso nyeleneh!',
  },
  greedy: {
    id: 'greedy',
    name: 'Nambah Porsi!',
    emoji: '🍲',
    bgHex: '#EC4899', // Pink
    borderColor: '#DB2777',
    description: 'Tetelan melimpah, kuah pekat!',
  },
};

export const EXPRESSION_LIST = Object.values(EXPRESSIONS);
