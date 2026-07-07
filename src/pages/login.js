import './auth.css';
import { getSupabaseClient, redirectTo } from '../lib/supabase.js';

export const renderLoginPage = () => ({
  html: `
    <section class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-5">
          <div class="auth-card card-glow p-4 rounded-4">
            <h2 class="mb-3" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px; font-size: 2.5rem">Welcome back</h2>
            <p class="text-secondary">Enter your details to continue your mission.</p>
            <form id="login-form" class="needs-validation" novalidate>
              <div class="mb-3">
                <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"">Email</label>
                <input id="login-email" class="form-control" type="email" placeholder="player@example.com" required />
              </div>
              <div class="mb-3">
                <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"">Password</label>
                <input id="login-password" class="form-control" type="password" placeholder="••••••••" required />
              </div>
              <div id="login-message" class="small mb-3 text-info"></div>
              <button class="btn btn-primary w-100" type="submit" style="font-weight:bold; font-size: 1.25rem; background-color: #00ffcc; border-color: #00ffcc; color: #000">Login</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
  onMount: () => {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const message = document.getElementById('login-message');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = 'Signing in…';
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
      });
      if (error) {
        message.textContent = error.message;
        message.className = 'small mb-3 text-danger';
        return;
      }
      if (data?.user) {
        message.textContent = 'Signed in successfully';
        message.className = 'small mb-3 text-success';
        redirectTo('/');
      }
    });
  }
});
