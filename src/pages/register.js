import './auth.css';
import { getSupabaseClient, redirectTo } from '../lib/supabase.js';

export const renderRegisterPage = () => ({
  html: `
    <section class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="auth-card card-glow p-4 rounded-4">
            <h2 class="mb-3" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;">Create your account</h2>
            <p class="text-secondary">Join the arena and start tracking your survival runs.</p>
            <form id="register-form">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"">First name</label>
                  <input id="register-first-name" class="form-control" type="text" placeholder="Ada" />
                </div>
                <div class="col-md-6">
                  <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"">Last name</label>
                  <input id="register-last-name" class="form-control" type="text" placeholder="Lovelace" />
                </div>
              </div>
              <div class="mt-3">
                <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"   ">Email</label>
                <input id="register-email" class="form-control" type="email" placeholder="player@example.com" required />
              </div>
              <div class="mt-3">
                <label class="form-label" style="font-weight:bold; border-left: 3px solid #00ffcc; border-bottom: 1.5px solid #00ffcc; padding-left: 10px;"   ">Password</label>
                <input id="register-password" class="form-control" type="password" placeholder="••••••••" required />
              </div>
              <div id="register-message" class="small mt-3 text-info"></div>
              <button class="btn btn-success w-100 mt-4" type="submit" style="font-weight:bold">Register</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
  onMount: () => {
    const form = document.getElementById('register-form');
    const message = document.getElementById('register-message');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const firstNameInput = document.getElementById('register-first-name');
    const lastNameInput = document.getElementById('register-last-name');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = 'Creating account…';
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
        options: {
          data: {
            first_name: firstNameInput.value,
            last_name: lastNameInput.value
          }
        }
      });

      if (error) {
        message.textContent = error.message;
        message.className = 'small mt-3 text-danger';
        return;
      }

      if (data?.user) {

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: `Anonymous-${data.user.id.slice(0, 8)}` + `...`
          });

        message.textContent = 'Account created. Redirecting…';
        message.className = 'small mt-3 text-success';
        redirectTo('/dashboard');
      }
    });
  }
});
