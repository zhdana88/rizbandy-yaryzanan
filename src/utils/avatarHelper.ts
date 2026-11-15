import { Player } from '../types';

/**
 * Generates a consistent, high-quality vector avatar URL for any player name
 */
export function getDefaultAvatar(name: string, id?: string): string {
  const seed = (id ? `${id}-${name}` : name).trim();
  // Using DiceBear adventurer style with neutral/warm sporting background tints
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c5e1a5,ffe082,80deea`;
}

/**
 * Ensures all players in an array have a valid, non-empty avatar image URL
 */
export function ensurePlayerAvatars(players: Player[]): Player[] {
  if (!Array.isArray(players)) return [];
  return players.map((p) => {
    if (!p.avatar || p.avatar.trim() === '') {
      return {
        ...p,
        avatar: getDefaultAvatar(p.name, p.id),
      };
    }
    return p;
  });
}
