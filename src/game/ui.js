export const setupUi = (game) => {
  const menu = document.getElementById('game-menu-overlay');
  const levelComplete = document.getElementById('level-complete-overlay');
  const gameOver = document.getElementById('game-over-overlay');

  return { menu, levelComplete, gameOver };
};
