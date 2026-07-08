export const GAME_DIMENSIONS = {
  width: 960,
  height: 540
};

export const LEVELS = [
  { id: 1, title: 'Back Alley', enemyCount: 4, difficulty: 1.0 },
  { id: 2, title: 'Rooftop Run', enemyCount: 6, difficulty: 1.2 },
  { id: 3, title: 'Subway Crossroads', enemyCount: 8, difficulty: 1.4 },
  { id: 4, title: 'Neon District', enemyCount: 10, difficulty: 1.6 },
  { id: 5, title: 'Final Block', enemyCount: 12, difficulty: 1.8 }
];

export const PLAYER_SPRITE_URL = new URL('../assets/player.jpg', import.meta.url).href;
export const ZOMBIE_SPRITE_URL = new URL('../assets/zombie.jpg', import.meta.url).href;
