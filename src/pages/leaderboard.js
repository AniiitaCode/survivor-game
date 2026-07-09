import './leaderboard.css';
import { getSupabaseClient } from '../lib/supabase.js';

export const renderLeaderboardPage = () => {
  return {
    html: `
      <section class="leaderboard-page py-5">
        <div class="container">

          <div class="text-center mb-4">
            <h1 class="fw-bold text-white">Leaderboard</h1>
            <p class="text-secondary">Top survivors across all runs</p>
          </div>

          <div class="row g-3 mb-4" id="top-3">
            <!-- Top 3 will be injected -->
          </div>

          <div class="glass-table p-3">
            <table class="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody id="leaderboard-body"></tbody>
            </table>
          </div>

        </div>
      </section>
    `,

    onMount: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase

        .from('leaderboards')
        .select(`
        score,
        level,
        mode,
        user_id,
        profiles!leaderboards_user_id_fk(username)
        `)
        .order('score', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const top3 = data.slice(0, 3);

      const topContainer = document.getElementById('top-3');

      const colors = ['gold', 'silver', 'bronze'];

      topContainer.innerHTML = top3.map((p, i) => `
        <div class="col-md-4">
          <div class="leader-card ${colors[i]}">
            <div class="rank">#${i + 1}</div>
            <div class="score">${p.score}</div>
            <div class="name">${p.profiles?.username || 'Anonymous'}</div>
          </div>
        </div>
      `).join('');

      const tbody = document.getElementById('leaderboard-body');

      tbody.innerHTML = data.map((row, i) => `
        <tr>
          <td>#${i + 1}</td>
          <td>${row.profiles?.username || 'anon'}</td>
          <td class="text-warning fw-bold">${row.score}</td>
          <td>${row.level}</td>
          <td><span class="badge bg-info">${row.mode}</span></td>
        </tr>
      `).join('');
    }
  };
};

