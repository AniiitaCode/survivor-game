import './dashboard.css';

const gameModes = [
  {
    id: 'survival',
    title: 'Survival Mode',
    badge: 'Balanced',
    badgeClass: 'bg-success',
    description: 'Classic wave-clearing with steady rewards and leaderboard scoring.',
    details: '1x pacing • regular drops • best for ranking',
    href: '/games/survival'
  },
  {
    id: 'challenge',
    title: 'Challenge Mode',
    badge: 'High Risk',
    badgeClass: 'bg-danger',
    description: 'Faster spawns, heavier rewards, and more aggressive waves.',
    details: '1.5x speed • richer drops • high reward loop',
    href: '/games/challenge'
  },
  {
    id: 'relax',
    title: 'Relax Mode',
    badge: 'Easy Flow',
    badgeClass: 'bg-info',
    description: 'Softer pacing with bonus XP and a calmer climb through waves.',
    details: '0.6x speed • XP-focused • low pressure',
    href: '/games/relax'
  }
];

export const renderDashboardPage = () => `
  <section class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <p class="text-secondary mb-0" style="font-weight: bold; font-size: 1.5rem;">Choose a mode and jump straight into the action. 👇</p>
      </div>
    </div>
    <div class="row g-4">
      ${gameModes.map((mode) => `
        <div class="col-md-6 col-xl-4">
          <div class="card-glow p-4 rounded-4 h-100">
            <div class="d-flex justify-content-between mb-3">
              <h5 class="fw-semibold">${mode.title}</h5>
              <span class="badge ${mode.badgeClass}" style="margin-bottom: 10px;">${mode.badge}</span>
            </div>
            <p class="text-secondary">${mode.description}</p>
            <p class="small text-secondary mb-3">${mode.details}</p>
            <a class="btn btn-primary" href="${mode.href}" data-route style="font-weight: bold; background-color: #00ffcc; border-color: #00ffcc; color: #000; font-size: 1.2rem; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);">Open mode</a>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
`;
