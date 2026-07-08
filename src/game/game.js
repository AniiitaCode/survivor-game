import { GAME_DIMENSIONS, LEVELS, PLAYER_SPRITE_URL, ZOMBIE_SPRITE_URL } from './config.js';
import { createRenderer } from './rendering.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { saveLeaderboardScore } from '../services/loaderboardService.js';
import { saveGameSession } from '../services/gameSessionService.js';

const MODE_DEFINITIONS = {
    survival: {
        title: 'Survival Mode',
        spawnMultiplier: 1,
        enemySpeedMultiplier: 1,
        xpMultiplier: 1,
        scoreMultiplier: 1,
        rewardChance: 0.3,
        leaderboard: true
    },
    challenge: {
        title: 'Challenge Mode',
        spawnMultiplier: 1.5,
        enemySpeedMultiplier: 1.25,
        xpMultiplier: 2,
        scoreMultiplier: 2,
        rewardChance: 0.7,
        leaderboard: true
    },
    relax: {
        title: 'Relax Mode',
        spawnMultiplier: 0.6,
        enemySpeedMultiplier: 0.8,
        xpMultiplier: 1.2,
        scoreMultiplier: 0.9,
        rewardChance: 0.55,
        leaderboard: false
    }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const createGame = ({ canvas, initialMode = 'survival', onGameOver, onSave, onSessionSave }) => {
    const ctx = canvas.getContext('2d');
    const renderer = createRenderer(ctx, canvas);
    const { width, height } = GAME_DIMENSIONS;
    const keys = {};
    const mode = (initialMode || 'survival').toLowerCase();
    const modeConfig = MODE_DEFINITIONS[mode] || MODE_DEFINITIONS.survival;

    const loadSprite = (url) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ image: img, loaded: true });
        img.onerror = () => resolve({ image: null, loaded: false });
        img.src = url;
    });

    class Entity {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        getBounds() {
            return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
        }
    }

    let leaderboardSaved = false;

    const saveToLeaderboard = async () => {
        if (!onSave) return;
        if (!modeConfig.leaderboard) return;
        if (leaderboardSaved) return;

        leaderboardSaved = true;

        try {
            await onSave({
                score: state.score,
                level: state.currentLevel,
                mode: state.mode
            });
        } catch (e) {
            leaderboardSaved = false;
        }
    };


    class Player extends Entity {
        constructor(sprite) {
            super(width / 2, height / 2, 56, 56);
            this.sprite = sprite;
            this.maxSpeed = 240;
            this.acceleration = 950;
            this.friction = 0.86;
            this.vx = 0;
            this.vy = 0;
            this.maxHp = 100;
            this.hp = this.maxHp;
            this.attackCooldown = 0;
            this.attackRange = 95;
            this.attackSpeed = 0.35;
            this.facing = 1;
            this.level = 1;
            this.xp = 0;
            this.maxXp = 120;
            this.shield = 0;
        }

        update(dt) {
            const left = keys['a'] || keys['ArrowLeft'];
            const right = keys['d'] || keys['ArrowRight'];
            const up = keys['w'] || keys['ArrowUp'];
            const down = keys['s'] || keys['ArrowDown'];

            let ax = 0;
            let ay = 0;
            if (left) ax -= 1;
            if (right) ax += 1;
            if (up) ay -= 1;
            if (down) ay += 1;

            if (ax !== 0 || ay !== 0) {
                const len = Math.hypot(ax, ay) || 1;
                ax /= len;
                ay /= len;
                this.vx += ax * this.acceleration * dt;
                this.vy += ay * this.acceleration * dt;
                this.facing = ax >= 0 ? 1 : -1;
            }

            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.x = Math.min(width - 28, Math.max(28, this.x));
            this.y = Math.min(height - 28, Math.max(28, this.y));

            const attackSpeedMultiplier = state.activeBuffs.fastAttack > 0 ? 1.65 : 1;
            this.attackCooldown = Math.max(0, this.attackCooldown - dt * attackSpeedMultiplier);
        }

        takeDamage(amount) {
            let remaining = amount;
            if (this.shield > 0) {
                const absorbed = Math.min(this.shield, remaining);
                this.shield -= absorbed;
                remaining -= absorbed;
            }
            this.hp = Math.max(0, this.hp - remaining);
            if (this.hp <= 0) {
                state.gameOver = true;
                overlay.gameOver.classList.remove('d-none');

                saveToLeaderboard();

                onSessionSave?.({
                    score: state.score,
                    level: state.currentLevel,
                    enemiesKilled: state.enemiesKilled,
                    durationSeconds: Math.floor((Date.now() - state.startTime) / 1000)
                });

                onGameOver?.(state);
            }
            state.shakeTime = 0.16;
        }

        gainXp(amount) {
            const effectiveAmount = amount * state.getXpMultiplier();
            this.xp += effectiveAmount;
            while (this.xp >= this.maxXp) {
                this.xp -= this.maxXp;
                this.level += 1;
                this.maxXp = 120 + this.level * 20;
            }
        }

        draw() {
            renderer.drawSprite(this.sprite, this.x, this.y, this.width, this.height, this.facing);
        }
    }

    class Zombie extends Entity {
        constructor(type, x, y, levelMultiplier) {
            super(x, y, type === 'tank' ? 54 : 48, type === 'tank' ? 54 : 48);

            this.type = type;
            this.maxHp = type === 'tank' ? 6 : 3;
            this.hp = this.maxHp + Math.floor(levelMultiplier * 0.4);

            this.speed = (type === 'tank' ? 55 : 75) * levelMultiplier * modeConfig.enemySpeedMultiplier;
            this.value = type === 'tank' ? 24 : 16;

            this.sprite = null;
            this.dead = false;
            this.facing = 1;

            this.attackCooldown = 0;
            this.damage = 10;
            this.attackRange = 40;
            this.attackRate = 1.0;
        }

        update(dt) {
            const dx = state.player.x - this.x;
            const dy = state.player.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;

            const slowMultiplier = state.activeBuffs.slowMotion > 0 ? 0.6 : 1;


            this.x += (dx / dist) * this.speed * dt * slowMultiplier;
            this.y += (dy / dist) * this.speed * dt * slowMultiplier;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.facing = dx >= 0 ? 1 : -1;
            }


            if (this.attackCooldown > 0) {
                this.attackCooldown -= dt;
            }


            if (dist < this.attackRange) {
                this.attackPlayer();
            }
        }

        attackPlayer() {
            if (this.attackCooldown > 0) return;

            this.attackCooldown = this.attackRate;

            state.player.takeDamage(this.damage);
        }

        draw() {
            renderer.drawSprite(this.sprite, this.x, this.y, this.width, this.height, this.facing || 1);
        }
    }

    class Reward extends Entity {
        constructor(x, y, type) {
            super(x, y, 20, 20);
            this.type = type;
            this.collected = false;
            this.life = 12;
            this.vx = (Math.random() - 0.5) * 32;
            this.vy = (Math.random() - 0.5) * 32;
        }

        update(dt) {
            this.life -= dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            const dx = state.player.x - this.x;
            const dy = state.player.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 90) {
                this.x += (dx / dist) * 140 * dt;
                this.y += (dy / dist) * 140 * dt;
            }
            if (dist < 26) {
                this.collect();
            }
        }

        collect() {
            if (this.collected) return;
            this.collected = true;
            switch (this.type) {
                case 'xp':
                    state.player.gainXp(18);
                    state.floatingTexts.push(new FloatingText('+XP', this.x, this.y, '#22d3ee'));
                    break;
                case 'score10':
                    state.activeBuffs.scoreMultiplier = 8;
                    state.scoreMultiplierBonus = 1.1;
                    state.floatingTexts.push(new FloatingText('Score +10%', this.x, this.y, '#f59e0b'));
                    break;
                case 'score25':
                    state.activeBuffs.scoreMultiplier = 8;
                    state.scoreMultiplierBonus = 1.25;
                    state.floatingTexts.push(new FloatingText('Score +25%', this.x, this.y, '#f59e0b'));
                    break;
                case 'score50':
                    state.activeBuffs.scoreMultiplier = 8;
                    state.scoreMultiplierBonus = 1.5;
                    state.floatingTexts.push(new FloatingText('Score +50%', this.x, this.y, '#f59e0b'));
                    break;
                case 'fastAttack':
                    state.activeBuffs.fastAttack = 8;
                    state.floatingTexts.push(new FloatingText('Fast Attack', this.x, this.y, '#fb7185'));
                    break;
                case 'shield':
                    state.activeBuffs.shield = 8;
                    state.player.shield = 40;
                    state.floatingTexts.push(new FloatingText('Shield', this.x, this.y, '#38bdf8'));
                    break;
                case 'slowMotion':
                    state.activeBuffs.slowMotion = 6;
                    state.floatingTexts.push(new FloatingText('Slow Motion', this.x, this.y, '#a78bfa'));
                    break;
                case 'doubleXp':
                    state.activeBuffs.doubleXp = 10;
                    state.floatingTexts.push(new FloatingText('Double XP', this.x, this.y, '#2dd4bf'));
                    break;
                default:
                    break;
            }
        }

        draw() {
            const colors = {
                xp: '#22d3ee',
                score10: '#f59e0b',
                score25: '#fb923c',
                score50: '#f97316',
                fastAttack: '#fb7185',
                shield: '#38bdf8',
                slowMotion: '#a78bfa',
                doubleXp: '#2dd4bf'
            };
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.shadowBlur = 14;
            ctx.shadowColor = colors[this.type] || '#ffffff';
            ctx.fillStyle = colors[this.type] || '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 260;
            this.vy = (Math.random() - 0.5) * 260;
            this.life = 0.45 + Math.random() * 0.25;
            this.color = color;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.life -= dt;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = clamp(this.life / 0.8, 0, 1);
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 3, 3);
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(text, x, y, color) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.life = 0.8;
            this.color = color;
        }

        update(dt) {
            this.y -= 40 * dt;
            this.life -= dt;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = clamp(this.life / 0.8, 0, 1);
            ctx.fillStyle = this.color;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    const overlay = {
        menu: document.getElementById('game-menu-overlay'),
        levelComplete: document.getElementById('level-complete-overlay'),
        gameOver: document.getElementById('game-over-overlay')
    };

    const ui = {
        startButton: document.getElementById('start-game-button'),
        nextButton: document.getElementById('next-level-button'),
        restartButton: document.getElementById('restart-game-button'),
        levelLabel: document.getElementById('current-level-label'),
        remainingLabel: document.getElementById('remaining-enemies-label'),
        scoreLabel: document.getElementById('score-label'),
        hpLabel: document.getElementById('hp-label'),
        statusLabel: document.getElementById('status-label'),
        hpBar: document.querySelector('.progress-bar')
    };

    const state = {
        player: null,
        enemies: [],
        rewards: [],
        particles: [],
        floatingTexts: [],
        entities: [],
        currentLevel: 1,
        enemiesRemaining: 0,
        score: 0,
        gameOver: false,
        menuOpen: true,
        levelComplete: false,
        shakeTime: 0,
        animationFrame: null,
        lastTime: 0,
        spritesLoaded: false,
        saveAttempted: false,
        enemiesKilled: 0,
        startTime: null,
        mode,
        modeConfig,
        scoreMultiplierBonus: 1,
        activeBuffs: {
            doubleXp: 0,
            fastAttack: 0,
            shield: 0,
            slowMotion: 0,
            scoreMultiplier: 0
        }
    };

    state.getXpMultiplier = () => modeConfig.xpMultiplier * (state.activeBuffs.doubleXp > 0 ? 2 : 1);
    state.getScoreMultiplier = () => modeConfig.scoreMultiplier * (state.activeBuffs.scoreMultiplier > 0 ? state.scoreMultiplierBonus : 1);

    const updateHud = () => {
        if (!state.player) return;

        ui.levelLabel.textContent = `Level ${state.currentLevel}`;
        ui.remainingLabel.textContent = `${state.enemiesRemaining}`;
        ui.scoreLabel.textContent = `${state.score}`;
        ui.hpLabel.textContent = `${Math.max(0, Math.round(state.player.hp))}`;

        const hpPercent = (state.player.hp / state.player.maxHp) * 100;
        ui.hpBar.style.width = `${Math.max(0, hpPercent)}%`;

        ui.statusLabel.textContent = state.levelComplete
            ? 'Level complete'
            : state.gameOver
                ? 'Game over'
                : `${modeConfig.title} • click zombies to clear them`;
    };

    const spawnParticles = (x, y, color) => {
        for (let index = 0; index < 18; index += 1) {
            state.particles.push(new Particle(x, y, color));
        }
    };

    const spawnFloatingText = (text, x, y, color) => {
        state.floatingTexts.push(new FloatingText(text, x, y, color));
    };

    const spawnRewardDrop = (x, y) => {
        if (Math.random() > modeConfig.rewardChance) return;
        const rewardPool = [
            { type: 'xp', weight: mode === 'relax' ? 42 : mode === 'challenge' ? 24 : 30 },
            { type: 'score10', weight: mode === 'challenge' ? 16 : 10 },
            { type: 'score25', weight: mode === 'challenge' ? 12 : 7 },
            { type: 'score50', weight: mode === 'challenge' ? 8 : 4 },
            { type: 'fastAttack', weight: mode === 'challenge' ? 10 : 6 },
            { type: 'shield', weight: mode === 'challenge' ? 10 : 6 },
            { type: 'slowMotion', weight: mode === 'challenge' ? 8 : 5 },
            { type: 'doubleXp', weight: mode === 'challenge' ? 12 : 8 }
        ];
        const totalWeight = rewardPool.reduce((sum, reward) => sum + reward.weight, 0);
        let roll = Math.random() * totalWeight;
        let chosenReward = rewardPool[0];
        for (const reward of rewardPool) {
            roll -= reward.weight;
            if (roll <= 0) {
                chosenReward = reward;
                break;
            }
        }
        state.rewards.push(new Reward(x, y, chosenReward.type));
    };

    const handleEnemyKill = (enemy) => {
        if (!enemy || enemy.dead) return false;
        enemy.dead = true;
        state.enemies = state.enemies.filter((item) => item !== enemy);
        state.enemiesRemaining = state.enemies.length;
        const scoreGain = Math.round(enemy.value * state.getScoreMultiplier());
        state.score += scoreGain;
        state.player.gainXp(enemy.value * 2);
        spawnParticles(enemy.x, enemy.y, enemy.color || '#f43f5e');
        spawnFloatingText(`+${scoreGain}`, enemy.x, enemy.y - 20, '#fef3c7');
        spawnRewardDrop(enemy.x, enemy.y);
        state.shakeTime = 0.06;
        state.enemiesKilled++;
        return true;
    };

    const resetLevel = () => {
        const levelConfig = LEVELS[Math.min(state.currentLevel - 1, LEVELS.length - 1)];
        const enemyCount = Math.max(3, Math.round(levelConfig.enemyCount * modeConfig.spawnMultiplier + (state.currentLevel - 1) * (mode === 'challenge' ? 0.75 : mode === 'relax' ? 0.35 : 0.45)));
        state.enemies = [];
        state.enemiesRemaining = enemyCount;
        state.levelComplete = false;
        overlay.levelComplete.classList.add('d-none');
        overlay.menu.classList.add('d-none');
        state.menuOpen = false;
        const spawnPoints = [];
        for (let index = 0; index < enemyCount; index += 1) {
            const side = index % 4;
            if (side === 0) spawnPoints.push({ x: 80, y: 80 + index * 40 });
            if (side === 1) spawnPoints.push({ x: width - 80, y: 80 + index * 30 });
            if (side === 2) spawnPoints.push({ x: 120 + index * 30, y: 80 });
            if (side === 3) spawnPoints.push({ x: 120 + index * 25, y: height - 80 });
        }
        spawnPoints.slice(0, enemyCount).forEach((point, index) => {
            const type = index % 4 === 0 ? 'tank' : index % 3 === 0 ? 'fast' : 'basic';
            const enemy = new Zombie(type, point.x, point.y, levelConfig.difficulty);
            enemy.sprite = state.sprites?.zombie || null;
            state.enemies.push(enemy);
        });
        state.entities = [state.player, ...state.enemies, ...state.rewards];
        updateHud();
    };

    const startGame = () => {
        leaderboardSaved = false;

        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
            state.animationFrame = null;
        }

        state.lastTime = 0;

        state.gameOver = false;
        state.levelComplete = false;
        state.currentLevel = 1;
        state.score = 0;
        state.enemiesKilled = 0;
        state.startTime = Date.now();
        state.enemies = [];
        state.rewards = [];
        state.particles = [];
        state.floatingTexts = [];
        state.activeBuffs = {
            doubleXp: 0,
            fastAttack: 0,
            shield: 0,
            slowMotion: 0,
            scoreMultiplier: 0
        };
        state.scoreMultiplierBonus = 1;
        state.player = new Player(state.sprites?.player || { loaded: false, image: null });
        state.player.shield = 0;
        resetLevel();

        overlay.menu.classList.add('d-none');
        overlay.gameOver.classList.add('d-none');
        overlay.levelComplete.classList.add('d-none');

        state.menuOpen = false;
        updateHud();

        state.animationFrame = requestAnimationFrame(loop);
    };

    const advanceLevel = () => {
        state.currentLevel += 1;
        state.player.level = state.currentLevel;
        resetLevel();
        overlay.levelComplete.classList.add('d-none');
        state.levelComplete = false;
    };

    const updateBuffs = (dt) => {
        Object.keys(state.activeBuffs).forEach((key) => {
            if (state.activeBuffs[key] > 0) {
                state.activeBuffs[key] -= dt;
            }
            if (state.activeBuffs[key] <= 0) {
                state.activeBuffs[key] = 0;
            }
        });
        if (state.activeBuffs.shield <= 0) {
            state.player.shield = 0;
        }
        if (state.activeBuffs.scoreMultiplier <= 0) {
            state.scoreMultiplierBonus = 1;
        }
    };

    const updateGame = (dt) => {
        if (state.menuOpen || state.levelComplete || state.gameOver) {
            return;
        }
        state.player.update(dt);
        updateBuffs(dt);
        state.enemies.forEach((enemy) => enemy.update(dt));
        state.rewards.forEach((reward) => reward.update(dt));
        state.particles.forEach((particle) => particle.update(dt));
        state.floatingTexts.forEach((text) => text.update(dt));
        state.rewards = state.rewards.filter((reward) => !reward.collected && reward.life > 0);
        state.particles = state.particles.filter((particle) => particle.life > 0);
        state.floatingTexts = state.floatingTexts.filter((text) => text.life > 0);
        state.enemies = state.enemies.filter((enemy) => !enemy.dead);
        state.enemiesRemaining = state.enemies.length;
        state.entities = [state.player, ...state.enemies, ...state.rewards];
        state.shakeTime = Math.max(0, state.shakeTime - dt);

        if (state.enemiesRemaining <= 0 && !state.levelComplete) {
            state.levelComplete = true;
            overlay.levelComplete.classList.remove('d-none');
            state.score += 150 * state.currentLevel;
            updateHud();
        }
        updateHud();
    };

    const handlePointerDown = (event) => {
        if (state.menuOpen || state.levelComplete || state.gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * width;
        const y = ((event.clientY - rect.top) / rect.height) * height;
        const target = state.enemies.find((enemy) => distance(enemy.x, enemy.y, x, y) <= enemy.width / 2 + 8);
        if (target) {
            handleEnemyKill(target);
        }
    };

    const handleKeyDown = (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;
        if (event.key === 'Enter' && state.menuOpen) {
            startGame();
        }
    };

    const handleKeyUp = (event) => {
        keys[event.key.toLowerCase()] = false;
    };

    const loop = (time) => {
        if (!state.lastTime) state.lastTime = time;
        const dt = Math.min(0.032, (time - state.lastTime) / 1000);
        state.lastTime = time;
        updateGame(dt);
        renderer.render(state);
        state.animationFrame = window.requestAnimationFrame(loop);
    };

    const cleanup = () => {
        if (state.animationFrame) window.cancelAnimationFrame(state.animationFrame);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('pointerdown', handlePointerDown);
    };

    const init = async () => {
        const [playerSprite, zombieSprite] = await Promise.all([loadSprite(PLAYER_SPRITE_URL), loadSprite(ZOMBIE_SPRITE_URL)]);
        state.sprites = { player: playerSprite, zombie: zombieSprite };
        state.spritesLoaded = true;
        state.player = new Player(playerSprite);
        state.entities = [state.player];
        updateHud();
        renderer.render(state);
    };

    ui.startButton.addEventListener('click', () => {
        startGame();
    });

    ui.nextButton.addEventListener('click', () => {
        advanceLevel();
    });

    ui.restartButton.addEventListener('click', () => {
        startGame();
    });

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.style.touchAction = 'none';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.__survivorGameCleanup = cleanup;
    init();
    state.animationFrame = window.requestAnimationFrame(loop);

    return { cleanup, startGame, advanceLevel };
};
