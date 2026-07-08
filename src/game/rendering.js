import { GAME_DIMENSIONS } from './config.js';

export const createRenderer = (ctx, canvas) => {
  const { width, height } = GAME_DIMENSIONS;

  const drawBackground = (state) => {
    const glowOffset = state.shakeTime > 0 ? Math.sin(Date.now() * 0.01) * 6 : 0;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#060915';
    ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0b1020');
    gradient.addColorStop(1, '#11182a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(glowOffset, glowOffset);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawSprite = (sprite, x, y, width, height, facing = 1) => {
    if (!sprite?.loaded) return;
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sprite.image, -width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const drawOverlayText = (text, x, y, color = '#fff') => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const render = (state) => {
    ctx.save();
    const shakeOffset = state.shakeTime > 0 ? (Math.random() - 0.5) * 8 : 0;
    ctx.translate(shakeOffset, shakeOffset);
    drawBackground(state);
    state.entities.forEach((entity) => entity.draw(ctx));
    state.particles?.forEach((particle) => particle.draw());
    state.floatingTexts?.forEach((text) => text.draw());
    if (state.menuOpen) {
      drawOverlayText('Survivor: Level Run', width / 2, height / 2 - 24, '#f8fafc');
      drawOverlayText('Press Start Game', width / 2, height / 2 + 16, '#22d3ee');
    }
    if (state.levelComplete) {
      drawOverlayText(`Level ${state.currentLevel} Complete`, width / 2, height / 2 - 24, '#fbbf24');
      drawOverlayText('Preparing next wave...', width / 2, height / 2 + 16, '#f8fafc');
    }
    ctx.restore();
  };

  return {
    render,
    drawSprite
  };
};
