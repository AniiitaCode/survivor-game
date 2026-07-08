import './home.css';
import { getCurrentUser } from '../lib/supabase.js';

export const renderHomePage = () => ({
  html: `
    <section class="container py-5">
      <div class="row g-4 align-items-center">
        <div class="col-lg-7">
          <h1 class="display-4 fw-bold">Survive the storm...</h1>
          <br>
          <p class="lead text-secondary"></p>
          <div class="d-flex gap-3" id="home-buttons">
            <!-- Buttons will be rendered based on auth status -->
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card-glow p-4 rounded-4">
            <canvas id="home-canvas" width="420" height="280"></canvas>
          </div>
        </div>
      </div>
    </section>
  `,
  onMount: async () => {
    
    const buttonsContainer = document.getElementById('home-buttons');
    const user = await getCurrentUser();
    
    if (user) {
      
      buttonsContainer.innerHTML = `
        <a id="leaderboardBtn" class="btn btn-primary btn-lg" href="/leaderboard" data-route>Go to Leaderboard</a>
      `;
    } else {
      
      buttonsContainer.innerHTML = `
        <a class="btn btn-primary btn-lg" href="/register" data-route style="font-weight:bold">Create Account</a>
        <a class="btn btn-outline-light btn-lg" href="/login" data-route style="font-weight:bold">Login</a>
      `;
    }
    
    const canvas = document.getElementById('home-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0b1320';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, 30 + i * 20);
        ctx.lineTo(canvas.width, 70 + Math.sin(frame / 30 + i) * 20 + i * 10);
        ctx.stroke();
      }
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(120 + Math.sin(frame / 25) * 20, 150 + Math.cos(frame / 25) * 20, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(220, 150, 90, 60);
      frame += 1;
      requestAnimationFrame(draw);
    };
    draw();
  }
});
