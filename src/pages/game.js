import './game.css';
import { createGame } from '../game/game.js';
import { saveLeaderboardScore } from '../services/loaderboardService.js';
import { saveGameSession } from '../services/gameSessionService.js';
import { updateStatistics } from '../services/statisticService.js';

const resolveMode = (id = '') => {
    const normalized = id.toLowerCase();
    if (normalized.includes('challenge')) return 'challenge';
    if (normalized.includes('relax')) return 'relax';
    return 'survival';
};

export const renderGamePage = (params) => {
    const initialMode = resolveMode(params?.id || '');
    let modeTitle = 'Survival Mode';
    let modeDescription = 'Balanced waves with steady rewards.';

    if (initialMode === 'challenge') {
        modeTitle = 'Challenge Mode';
        modeDescription = 'Faster spawns and high-value rewards.';
    } else if (initialMode === 'relax') {
        modeTitle = 'Relax Mode';
        modeDescription = 'Slower pacing with bonus XP and calmer encounters.';
    }

    return {
        html: `
      <section class="container py-3 py-lg-5">
        <div class="row g-4">
          <div class="col-12">
            <div class="card-glow p-3 p-lg-4 rounded-4">

              <!-- Page header: mode title + back button -->
              <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                  <h2 class="fw-bold mb-1">${modeTitle}</h2>
                  <p class="text-secondary mb-0">${modeDescription} Click or tap zombies to clear waves.</p>
                </div>
                <a class="btn btn-outline-light btn-sm" href="/dashboard" data-route style="font-weight: bold;">Back to dashboard</a>
              </div>

              <!-- HUD stats row – sits ABOVE the canvas, never overlaps it -->
              <div class="game-hud-bar row g-2 mb-2 align-items-stretch">
                <div class="col-12 col-md-7">
                  <div class="bg-dark bg-opacity-75 rounded-3 border border-light border-opacity-10 p-3 h-100">
                    <div class="d-flex justify-content-between small text-uppercase text-secondary mb-2">
                      <span>HP</span>
                      <span id="hp-label">100</span>
                    </div>
                    <div class="progress mb-3" style="height: 10px;">
                      <div class="progress-bar bg-danger" style="width: 100%"></div>
                    </div>
                    <div class="d-flex justify-content-between small text-secondary mb-2">
                      <span>Score: <strong id="score-label">0</strong></span>
                      <span>Level: <strong id="current-level-label">1</strong></span>
                    </div>
                    <div class="d-flex justify-content-between small text-uppercase text-secondary mb-2">
                      <span>Remaining</span>
                      <span id="remaining-enemies-label">0</span>
                    </div>
                    <div class="small text-secondary" id="status-label">Press Start Game</div>
                  </div>
                </div>
                <div class="col-12 col-md-5">
                  <div class="bg-dark bg-opacity-75 rounded-3 border border-light border-opacity-10 p-3 h-100 text-start">
                    <div class="small text-uppercase text-secondary mb-2">Objective</div>
                    <div class="fw-bold fs-5">Clear every wave</div>
                    <div class="small text-secondary mt-2">Move with WASD • click or tap enemies to clear them</div>
                  </div>
                </div>
              </div>

              <!-- Canvas wrapper – only the modal overlays sit on top of it -->
              <div class="position-relative">
                <canvas id="game-canvas" width="960" height="540" tabindex="0"></canvas>

                <div id="game-menu-overlay" class="position-absolute top-0 start-0 w-100 h-100">
                  <div class="d-flex align-items-center justify-content-center h-100 p-3">
                    <div class="bg-dark rounded-4 border border-info border-opacity-25 p-4 shadow-lg text-center" style="max-width: 520px; width: 100%;">
                      <h3 class="fw-bold mb-2">Survivor: Level Run</h3>
                      <p class="text-secondary mb-4">Defeat each wave, survive the level, and prepare for the next challenge.</p>
                      <button id="start-game-button" class="btn btn-info btn-lg px-4">Start Game</button>
                    </div>
                  </div>
                </div>

                <div id="level-complete-overlay" class="position-absolute top-0 start-0 w-100 h-100 d-none">
                  <div class="d-flex align-items-center justify-content-center h-100 p-3">
                    <div class="bg-dark rounded-4 border border-warning border-opacity-25 p-4 shadow-lg text-center" style="max-width: 520px; width: 100%;">
                      <h3 class="fw-bold mb-2 text-warning">Level Complete</h3>
                      <p class="text-secondary mb-4">The next wave is ready.</p>
                      <button id="next-level-button" class="btn btn-outline-light">Continue</button>
                    </div>
                  </div>
                </div>

                <div id="game-over-overlay" class="position-absolute top-0 start-0 w-100 h-100 d-none">
                  <div class="d-flex align-items-center justify-content-center h-100 p-3">
                    <div class="bg-dark rounded-4 border border-danger border-opacity-25 p-4 shadow-lg text-center" style="max-width: 520px; width: 100%;">
                      <h3 class="fw-bold mb-2 text-danger">Game Over</h3>
                      <p class="text-secondary mb-3">The barricade fell.</p>
                      <button id="restart-game-button" class="btn btn-outline-light">Restart</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    `,
        onMount: () => {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) return;

            canvas.focus();
            canvas.addEventListener('click', () => canvas.focus());

            if (window.__survivorGameCleanup) {
                window.__survivorGameCleanup();
            }

            createGame({
                canvas, initialMode,
                onSave: (data) => saveLeaderboardScore({
                    ...data,
                    mode: initialMode
                }),

                onSessionSave: async (data) => {

                    const saved = await saveGameSession(data);

                    if (saved) {
                        await updateStatistics();
                    }
                }

            });
        }
    };
}